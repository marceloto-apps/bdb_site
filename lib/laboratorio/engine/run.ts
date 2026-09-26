/**
 * Orquestra um run (§5.1): universo → indicadores → regra → entradas → staking cronológico →
 * liquidação → métricas. Devolve um `RunResult` serializável e determinístico (hash).
 */
import { camposReferenciados } from './ast'
import { avaliarColuna, avaliarMascara, compilar, type ContextoCompilacao } from './compile'
import { resolvedorEntrada, resolvedorReferencia } from './entradas'
import { prepararEstrategia, type Catalogo, type EstrategiaCompilada } from './estrategia'
import { liquidar, type Placar } from './liquidacao'
import * as M from './matematica'
import { calcularCaminho, calcularClv, calcularInferencia, calcularKpis, segmentar } from './metricas'
import { dependeDoBanco, estadoInicial, stakeBase, unidadeFlat } from './staking'
import { ENGINE_VERSAO, type Aposta, type Aviso, type Dataset, type Estrategia, type RunResult } from './tipos'
import { aplicarUniverso } from './universo'
import { validarAvancado, type HoldoutInfo } from './validacao'

export interface OpcoesRun {
  catalogo: Catalogo
  competicoesInfo?: Map<string, { tipo?: string; feminino?: boolean }>
  nomesCompeticoes?: Map<string, string>
  nomesTimes?: Map<string, string>
  /** incluir em cada aposta os valores dos indicadores e dos campos da regra (tabela/CSV) */
  extras?: boolean
  /** reamostras do bootstrap (padrão: estrategia.bootstrap ?? 1000) */
  bootstrap?: number
  /** limite de apostas devolvidas em `apostas` (métricas usam todas) */
  maxApostas?: number
  /** Fase 5: anexa `validacao` ao resultado */
  validacao?: boolean
  /** tentativas já registradas para a estratégia (deflação) */
  tentativasPrevias?: number
  /** temporadas de holdout por competição (resolvidas pelo manifesto) e jogos ocultos quando selado */
  holdout?: HoldoutInfo
  aoProgresso?: (fase: string, feitos: number, total: number) => void
}

interface Candidata { i: number; k: number; entradaId: string; selecao: string; linha: number | null; odd: number; oddLiq: number; data: number; matchId: string }

export function executar(estrategia: Estrategia, dataset: Dataset, op: OpcoesRun): RunResult {
  const t0 = Date.now()
  const ec = prepararEstrategia(estrategia, op.catalogo)
  return executarCompilada(ec, dataset, op, t0)
}

export function executarCompilada(ec: EstrategiaCompilada, dataset: Dataset, op: OpcoesRun, t0 = Date.now()): RunResult {
  const e = ec.estrategia
  const avisos: Aviso[] = [...ec.avisos]
  const ctx: ContextoCompilacao = { dataset, parametros: e.parametros ?? {}, indicadores: new Map(), camposAusentes: new Set() }

  // 1. universo
  const uni = aplicarUniverso(dataset, e.universo, op.competicoesInfo)
  avisos.push(...uni.avisos)

  // 2. indicadores
  for (const ind of ec.indicadores) ctx.indicadores.set(ind.nome, avaliarColuna(ind.ast, ctx))

  // 3. regra
  const mascara = ec.regra ? avaliarMascara(ec.regra, ctx) : new Uint8Array(dataset.n).fill(1)
  let nSel = 0
  for (let i = 0; i < dataset.n; i++) { mascara[i] &= uni.mascara[i]; nSel += mascara[i] }

  // colunas base
  const txt = (k: string) => dataset.textos.get(k)
  const num = (k: string) => dataset.numericas.get(k)
  const cId = txt('match.id'), cData = num('match.utc_date'), cComp = txt('match.competition'), cSeason = txt('match.season'), cLabel = txt('match.season_label')
  const cHome = txt('match.home'), cAway = txt('match.away')
  const ftH = num('match.ft_h'), ftA = num('match.ft_a'), htH = num('match.ht_h'), htA = num('match.ht_a'), coH = num('match.corners_h'), coA = num('match.corners_a')
  if (!cData) avisos.push({ tipo: 'cobertura', mensagem: 'Dataset sem match.utc_date: ordem cronológica indefinida', campo: 'match.utc_date' })

  // 4. entradas → candidatas
  const candidatas: Candidata[] = []
  const referencias = new Map<string, ReturnType<typeof resolvedorReferencia>>()
  for (const ent of ec.entradas) {
    const resolve = resolvedorEntrada(ent, ctx)
    if (!referencias.has(ent.entrada.mercado)) referencias.set(ent.entrada.mercado, resolvedorReferencia(ent.entrada.mercado, ctx, e.referencia?.casa ?? 'pinnacle'))
    for (let i = 0; i < dataset.n; i++) {
      if (!mascara[i]) continue
      const r = resolve(i)
      if (!r) continue
      candidatas.push({ i, k: candidatas.length, entradaId: ent.id, selecao: r.selecao, linha: r.linha, odd: r.odd, oddLiq: r.oddLiquidacao, data: cData ? cData[i] : NaN, matchId: cId?.[i] ?? String(i) })
    }
  }
  candidatas.sort((a, b) => (a.data - b.data) || (a.matchId < b.matchId ? -1 : a.matchId > b.matchId ? 1 : 0) || (a.entradaId < b.entradaId ? -1 : 1))

  // 5. staking cronológico + liquidação
  const bancoInicial = e.bancoInicial ?? 0
  const estado = estadoInicial(e)
  const probKelly = ec.stakingProb ? compilar(ec.stakingProb, ctx) : null
  const mults = new Map(ec.entradas.map((x) => [x.id, x.entrada.stakeMult ?? 1]))
  const apostas: Aposta[] = []
  let semStake = 0, paradas = 0, expostas = 0
  const extrasDe = op.extras ? montarExtras(ec, ctx) : null
  for (const c of candidatas) {
    if (estado.parado) { paradas++; continue }
    const prob = probKelly ? probKelly(c.i) : NaN
    const bancoRef = dependeDoBanco(e.staking) ? estado.banco : bancoInicial
    let stake = stakeBase(e.staking, bancoRef, c.odd, prob, mults.get(c.entradaId) ?? 1)
    if (!(stake > 0)) { semStake++; continue }
    // exposição por dia
    const dia = Number.isNaN(c.data) ? -1 : Math.floor(c.data / 86400000)
    if (dia !== estado.dia) { estado.dia = dia; estado.expostoNoDia = 0 }
    if (e.exposicaoMaxDia !== undefined) {
      const sobra = e.exposicaoMaxDia - estado.expostoNoDia
      if (sobra <= 0) { expostas++; continue }
      stake = Math.min(stake, sobra)
    }
    if (dependeDoBanco(e.staking) && stake > estado.banco) stake = estado.banco
    if (!(stake > 0)) { semStake++; continue }
    estado.expostoNoDia += stake

    const placar: Placar = { ftH: ftH ? ftH[c.i] : NaN, ftA: ftA ? ftA[c.i] : NaN, htH: htH?.[c.i], htA: htA?.[c.i], cornersH: coH?.[c.i], cornersA: coA?.[c.i] }
    const ent = ec.entradas.find((x) => x.id === c.entradaId) as EstrategiaCompilada['entradas'][number]
    const liq = liquidar(ent.entrada.mercado, c.selecao, c.linha, c.oddLiq, stake, placar)
    const ref = (referencias.get(ent.entrada.mercado) as ReturnType<typeof resolvedorReferencia>)(c.i, c.selecao, c.linha)
    estado.banco += liq.pnl
    if (estado.banco > estado.pico) estado.pico = estado.banco
    if (e.stopDrawdown !== undefined && estado.pico > 0 && (estado.pico - estado.banco) / estado.pico >= e.stopDrawdown) estado.parado = true

    const q = ref.q
    apostas.push({
      i: c.i, entradaId: c.entradaId, matchId: c.matchId, data: c.data,
      competicao: cComp?.[c.i] ?? '', temporada: cLabel?.[c.i] ?? cSeason?.[c.i] ?? '',
      home: op.nomesTimes?.get(cHome?.[c.i] ?? '') ?? cHome?.[c.i] ?? '', away: op.nomesTimes?.get(cAway?.[c.i] ?? '') ?? cAway?.[c.i] ?? '',
      mercado: ent.entrada.mercado, selecao: c.selecao, linha: c.linha, odd: c.odd, oddLiquidacao: c.oddLiq, stake,
      resultado: liq.resultado, pnl: liq.pnl,
      qRef: q, oddRef: ref.odd, refSrc: ref.src,
      ev: Number.isNaN(q) ? NaN : c.odd * q - 1,
      clvBruto: ref.odd > 1 ? c.odd / ref.odd - 1 : NaN,
      clvNovig: Number.isNaN(q) ? NaN : c.odd * q - 1,
      clvPontos: Number.isNaN(q) ? NaN : q - 1 / c.odd,
      banco: estado.banco,
      extras: extrasDe ? extrasDe(c.i) : undefined,
    })
  }

  // 6. métricas
  const uFlat = unidadeFlat(e)
  const kpis = calcularKpis(apostas, bancoInicial, uFlat)
  const caminho = calcularCaminho(apostas, bancoInicial)
  const clv = calcularClv(apostas)
  const reamostras = op.bootstrap ?? e.bootstrap ?? 1000
  const inferencia = calcularInferencia(apostas, kpis, reamostras, e.seed ?? 42)
  const segmentos = segmentar(apostas, op.nomesCompeticoes)

  // 7. avisos
  ctx.camposAusentes.forEach((k) => avisos.push({ tipo: 'cobertura', mensagem: `Campo sem dados no universo: ${k} (tratado como nulo)`, campo: k }))
  if (apostas.length && apostas.length < 300) avisos.push({ tipo: 'amostra', mensagem: `Apenas ${apostas.length} apostas: abaixo do mínimo recomendado (300) para inferência`, valor: apostas.length })
  if (clv.nComRef === 0 && apostas.length) avisos.push({ tipo: 'referencia', mensagem: 'Nenhuma aposta com referência de fechamento (EV/CLV indisponíveis)' })
  else if (clv.refSoft > 0) avisos.push({ tipo: 'referencia', mensagem: `${Math.round(clv.refSoft * 100)}% das referências usam o fechamento bet365 (soft) por falta de Pinnacle`, valor: clv.refSoft })
  if (semStake) avisos.push({ tipo: 'staking', mensagem: `${semStake} candidata(s) sem stake válido (Kelly ≤ 0, banco zerado ou probabilidade nula)`, valor: semStake })
  if (paradas) avisos.push({ tipo: 'staking', mensagem: `Stop de drawdown acionado: ${paradas} candidata(s) ignorada(s)`, valor: paradas })
  if (expostas) avisos.push({ tipo: 'staking', mensagem: `${expostas} candidata(s) fora pela exposição máxima diária`, valor: expostas })
  const viesOdds = nSel > 0 ? candidatas.length / (nSel * ec.entradas.length) : NaN
  if (nSel > 0 && viesOdds < 0.8) avisos.push({ tipo: 'cobertura', mensagem: `Só ${Math.round(viesOdds * 100)}% dos jogos selecionados têm a odd pedida (viés de disponibilidade)`, valor: viesOdds })

  const camposUsados = ec.camposUsados.slice().sort()
  // o hash ignora as opções de validação (só o holdout muda o universo e, portanto, o resultado)
  const eHash = { ...e, validacao: e.validacao?.holdout ? { holdout: e.validacao.holdout } : undefined }
  const hash = M.hash64(JSON.stringify({ e: eHash, v: dataset.versao ?? null, engine: ENGINE_VERSAO, n: apostas.length, lucro: kpis.lucro, turnover: kpis.turnover }))
  const resultado: RunResult = {
    hash, datasetVersao: dataset.versao ?? null, catalogoVersao: dataset.catalogoVersao ?? null, engineVersao: ENGINE_VERSAO,
    nUniverso: uni.n, nSelecionados: nSel, nApostas: apostas.length,
    kpis, caminho, clv, inferencia, segmentos,
    apostas: op.maxApostas !== undefined ? apostas.slice(0, op.maxApostas) : apostas,
    avisos, camposUsados, tempoMs: Date.now() - t0,
  }
  if (op.validacao) {
    resultado.validacao = validarAvancado(ec, dataset, { ...resultado, apostas }, { mascaraUniverso: uni.mascara, ctx, op, rodar: (ec2, ds, op2) => executarCompilada(ec2, ds, op2) })
    resultado.tempoMs = Date.now() - t0
  }
  return resultado
}

/** Valores dos indicadores e dos campos numéricos da regra, por linha (tabela de apostas/CSV). */
function montarExtras(ec: EstrategiaCompilada, ctx: ContextoCompilacao): (i: number) => Record<string, number | string | null> {
  const cols: [string, (i: number) => number | string | null][] = []
  for (const ind of ec.indicadores) { const c = ctx.indicadores.get(ind.nome) as Float64Array; cols.push([ind.nome, (i) => (Number.isNaN(c[i]) ? null : c[i])]) }
  const campos = new Set<string>()
  if (ec.regra) camposReferenciados(ec.regra).forEach((k) => campos.add(k))
  for (const ent of ec.entradas) for (const a of [ent.selecaoAst, ent.linhaAst, ent.condicaoAst]) if (a) camposReferenciados(a).forEach((k) => campos.add(k))
  for (const k of Array.from(campos).slice(0, 40)) {
    const n = ctx.dataset.numericas.get(k), t = ctx.dataset.textos.get(k)
    if (n) cols.push([k, (i) => (Number.isNaN(n[i]) ? null : n[i])])
    else if (t) cols.push([k, (i) => t[i]])
  }
  return (i) => { const o: Record<string, number | string | null> = {}; for (const [k, f] of cols) o[k] = f(i); return o }
}

/** Serialização segura do resultado (Float64Array → number[]). */
export function serializarRun(r: RunResult): unknown {
  return JSON.parse(JSON.stringify(r, (_k, v) => (v instanceof Float64Array ? Array.from(v) : v === Infinity ? 'Infinity' : typeof v === 'number' && Number.isNaN(v) ? null : v)))
}
