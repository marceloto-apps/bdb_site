/**
 * Explorador de vantagens: aposta "cega" (todos os jogos do universo) numa cesta de apostas básicas,
 * cruzada por liga × temporada e, opcionalmente, por faixas de uma estatística. Responde "em quais
 * ligas apostar sempre no mandante/over/… teria pago, e isso muda com a forma, o xG, a odd…?".
 *
 * Reaproveita o engine: `prepararEstrategia` compila as entradas e a estatística (validação, unidades,
 * campos usados); aqui só resolvemos odd, liquidamos a stake 1 e acumulamos por célula. Puro e
 * determinístico; sem staking cronológico (o objetivo é comparar ligas, não simular banco).
 */
import { avaliarColuna, type ContextoCompilacao } from './compile'
import { resolvedorEntrada, resolvedorReferencia } from './entradas'
import { prepararEstrategia, type Catalogo, type EstrategiaCompilada } from './estrategia'
import { liquidar, type Placar } from './liquidacao'
import * as M from './matematica'
import type { Entrada, Estrategia, Universo } from './tipos'
import { aplicarUniverso } from './universo'

export interface ApostaBasica extends Entrada { /** rótulo curto mostrado na matriz (ex.: "Mandante · bet365") */ rotulo: string }

export interface Cruzamento {
  /** rótulo da estatística (ex.: "Forma do mandante") */
  rotulo: string
  /** fórmula (campo do catálogo ou expressão) */
  formula: string
  /** tercis (padrão), quartis, ou cortes explícitos (limites internos crescentes) */
  cortes?: 'tercis' | 'quartis' | number[]
}

export interface OpcoesExploracao {
  universo?: Universo
  apostas: ApostaBasica[]
  cruzamento?: Cruzamento
  /** referência para EV/CLV (padrão pinnacle) */
  referencia?: 'pinnacle' | 'bet365'
}

export interface CelulaExploracao {
  /** chave da competição; '*' = todas as ligas */
  competicao: string
  /** rótulo da temporada; '*' = todas as temporadas */
  temporada: string
  aposta: string
  /** índice da faixa da estatística; -1 = todas as faixas */
  faixa: number
  n: number
  lucro: number
  yield: number
  hitRate: number
  oddMedia: number
  clvNovigMedio: number
  nRef: number
  /** p-valor bicaudal do yield contra −margem (t de Student) */
  pValor: number
}

export interface ResultadoExploracao {
  nUniverso: number
  apostas: string[]
  competicoes: { key: string; nome: string; temporadas: string[] }[]
  /** faixas da estatística (vazio sem cruzamento) */
  faixas: { rotulo: string; de: number | null; ate: number | null; n: number }[]
  cruzamento: { rotulo: string; formula: string; tipo: string; semDado: number } | null
  celulas: CelulaExploracao[]
  camposAusentes: string[]
  tempoMs: number
}

export interface ExploracaoPreparada { compilada: EstrategiaCompilada; opcoes: OpcoesExploracao; camposUsados: string[] }

/** Compila apostas e estatística com o mesmo validador do Laboratório (lança ErroEstrategia). */
export function prepararExploracao(op: OpcoesExploracao, cat: Catalogo): ExploracaoPreparada {
  if (!op.apostas.length) throw new Error('Escolha pelo menos uma aposta')
  const e: Estrategia = {
    versao: 1, universo: op.universo,
    indicadores: op.cruzamento ? [{ nome: 'cruz', expressao: { formula: op.cruzamento.formula } }] : undefined,
    entradas: op.apostas.map((a, k) => ({ id: `x${k}`, mercado: a.mercado, selecao: a.selecao, linha: a.linha, preco: a.preco, liquidacao: a.liquidacao, oddMin: a.oddMin, oddMax: a.oddMax })),
    staking: { metodo: 'flat', unidade: 1 }, referencia: { casa: op.referencia ?? 'pinnacle', snapshot: 'close' },
  }
  const compilada = prepararEstrategia(e, cat)
  return { compilada, opcoes: op, camposUsados: compilada.camposUsados }
}

const r4 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e4) / 1e4 : x)

interface Acum { n: number; lucro: number; soma2: number; hits: number; decididas: number; somaOdd: number; clv: number; nRef: number; margem: number }
const novo = (): Acum => ({ n: 0, lucro: 0, soma2: 0, hits: 0, decididas: 0, somaOdd: 0, clv: 0, nRef: 0, margem: 0 })

export function explorar(prep: ExploracaoPreparada, dataset: Awaited<ContextoCompilacao['dataset']>, op: { competicoesInfo?: Map<string, { tipo?: string; feminino?: boolean }>; nomesCompeticoes?: Map<string, string> } = {}): ResultadoExploracao {
  const t0 = Date.now()
  const { compilada: ec, opcoes } = prep
  const ctx: ContextoCompilacao = { dataset, parametros: {}, indicadores: new Map(), camposAusentes: new Set() }
  const uni = aplicarUniverso(dataset, opcoes.universo, op.competicoesInfo)

  // estatística → faixas
  let faixaDe: ((i: number) => number) | null = null
  let faixas: ResultadoExploracao['faixas'] = []
  let cruzamento: ResultadoExploracao['cruzamento'] = null
  if (opcoes.cruzamento && ec.indicadores.length) {
    const ind = ec.indicadores[0]
    const col = avaliarColuna(ind.ast, ctx)
    ctx.indicadores.set(ind.nome, col)
    const valores: number[] = []
    for (let i = 0; i < dataset.n; i++) if (uni.mascara[i] && !Number.isNaN(col[i])) valores.push(col[i])
    valores.sort((a, b) => a - b)
    let limites: number[]
    let rotulos: string[]
    const ehBool = ind.tipo === 'bool' || (valores.length > 0 && valores.every((v) => v === 0 || v === 1))
    const cortes = opcoes.cruzamento.cortes ?? 'tercis'
    if (ehBool) { limites = [0.5]; rotulos = ['Não', 'Sim'] }
    else if (Array.isArray(cortes)) { limites = cortes.slice().sort((a, b) => a - b); rotulos = limites.map((_, k) => (k === 0 ? `< ${fmt(limites[0])}` : `${fmt(limites[k - 1])} – ${fmt(limites[k])}`)).concat(limites.length ? [`≥ ${fmt(limites[limites.length - 1])}`] : ['todas']) }
    else {
      const k = cortes === 'quartis' ? 4 : 3
      limites = []
      for (let j = 1; j < k; j++) limites.push(M.quantil(valores, j / k))
      // limites arredondados a 3 casas (a regra gerada pelo "Levar ao Laboratório" reproduz a faixa) e faixas degeneradas colapsam
      limites = Array.from(new Set(limites.map((x) => Math.round(x * 1000) / 1000)))
      rotulos = k === 3 && limites.length === 2 ? [`Baixo (< ${fmt(limites[0])})`, `Médio (${fmt(limites[0])} – ${fmt(limites[1])})`, `Alto (≥ ${fmt(limites[1])})`]
        : k === 4 && limites.length === 3 ? [`1º quarto (< ${fmt(limites[0])})`, `2º quarto (${fmt(limites[0])} – ${fmt(limites[1])})`, `3º quarto (${fmt(limites[1])} – ${fmt(limites[2])})`, `4º quarto (≥ ${fmt(limites[2])})`]
        : limites.map((_, j) => (j === 0 ? `< ${fmt(limites[0])}` : `${fmt(limites[j - 1])} – ${fmt(limites[j])}`)).concat(limites.length ? [`≥ ${fmt(limites[limites.length - 1])}`] : ['todas'])
    }
    const lim = limites
    faixaDe = (i) => { const v = col[i]; if (Number.isNaN(v)) return -1; let f = 0; while (f < lim.length && v >= lim[f]) f++; return f }
    const contagem = new Array<number>(rotulos.length).fill(0)
    let semDado = 0
    for (let i = 0; i < dataset.n; i++) if (uni.mascara[i]) { const f = faixaDe(i); if (f < 0) semDado++; else contagem[f]++ }
    faixas = rotulos.map((rotulo, f) => ({ rotulo, de: f === 0 ? null : lim[f - 1], ate: f < lim.length ? lim[f] : null, n: contagem[f] }))
    cruzamento = { rotulo: opcoes.cruzamento.rotulo, formula: opcoes.cruzamento.formula, tipo: ind.tipo, semDado }
  }

  // colunas base
  const txt = (k: string) => dataset.textos.get(k)
  const num = (k: string) => dataset.numericas.get(k)
  const cComp = txt('match.competition'), cSeason = txt('match.season'), cLabel = txt('match.season_label')
  const ftH = num('match.ft_h'), ftA = num('match.ft_a'), htH = num('match.ht_h'), htA = num('match.ht_a'), coH = num('match.corners_h'), coA = num('match.corners_a')

  const celulas = new Map<string, Acum>()
  const acum = (chave: string) => { let a = celulas.get(chave); if (!a) { a = novo(); celulas.set(chave, a) } return a }
  const temporadasPorComp = new Map<string, Set<string>>()
  const rotulos = opcoes.apostas.map((a) => a.rotulo)

  ec.entradas.forEach((ent, k) => {
    const resolve = resolvedorEntrada(ent, ctx)
    const ref = resolvedorReferencia(ent.entrada.mercado, ctx, opcoes.referencia ?? 'pinnacle')
    for (let i = 0; i < dataset.n; i++) {
      if (!uni.mascara[i]) continue
      const r = resolve(i)
      if (!r) continue
      const placar: Placar = { ftH: ftH ? ftH[i] : NaN, ftA: ftA ? ftA[i] : NaN, htH: htH?.[i], htA: htA?.[i], cornersH: coH?.[i], cornersA: coA?.[i] }
      const liq = liquidar(ent.entrada.mercado, r.selecao, r.linha, r.oddLiquidacao, 1, placar)
      if (liq.resultado === 'VOID') continue
      const comp = cComp?.[i] ?? '?', temp = cLabel?.[i] ?? cSeason?.[i] ?? '?'
      let ts = temporadasPorComp.get(comp); if (!ts) { ts = new Set(); temporadasPorComp.set(comp, ts) } ts.add(temp)
      const q = ref(i, r.selecao, r.linha).q
      const clv = Number.isNaN(q) ? NaN : r.odd * q - 1
      const margem = Number.isNaN(q) ? NaN : 1 / r.odd - q
      const f = faixaDe ? faixaDe(i) : -1
      const alvos = [acum(`${comp}|${temp}|${k}|${f}`), acum(`${comp}|*|${k}|${f}`), acum(`*|*|${k}|${f}`)]
      if (f >= 0) alvos.push(acum(`${comp}|${temp}|${k}|-1`), acum(`${comp}|*|${k}|-1`), acum(`*|*|${k}|-1`))
      for (const a of alvos) {
        a.n++; a.lucro += liq.pnl; a.soma2 += liq.pnl * liq.pnl; a.somaOdd += r.odd
        if (liq.resultado !== 'REFUND') { a.decididas++; if (liq.resultado === 'WIN') a.hits++; else if (liq.resultado === 'HALF_WIN') a.hits += 0.5 }
        if (!Number.isNaN(clv)) { a.clv += clv; a.nRef++; a.margem += margem }
      }
    }
  })

  const saida: CelulaExploracao[] = []
  celulas.forEach((a, chave) => {
    const [competicao, temporada, k, f] = chave.split('|')
    const media = a.lucro / a.n
    const sd = a.n > 1 ? Math.sqrt(Math.max(0, (a.soma2 - a.n * media * media) / (a.n - 1))) : NaN
    const h0 = a.nRef ? -(a.margem / a.nRef) : 0
    const t = a.n > 1 && sd > 0 ? (media - h0) / (sd / Math.sqrt(a.n)) : NaN
    saida.push({
      competicao, temporada, aposta: rotulos[Number(k)], faixa: Number(f),
      n: a.n, lucro: r4(a.lucro), yield: r4(media), hitRate: r4(a.decididas ? a.hits / a.decididas : NaN), oddMedia: r4(a.somaOdd / a.n),
      clvNovigMedio: r4(a.nRef ? a.clv / a.nRef : NaN), nRef: a.nRef, pValor: r4(M.pValorT(t, a.n - 1)),
    })
  })

  const competicoes = Array.from(temporadasPorComp.entries()).map(([key, ts]) => ({ key, nome: op.nomesCompeticoes?.get(key) ?? key, temporadas: Array.from(ts).sort(ordemTemporada) })).sort((a, b) => a.nome.localeCompare(b.nome))
  return { nUniverso: uni.n, apostas: rotulos, competicoes, faixas, cruzamento, celulas: saida, camposAusentes: Array.from(ctx.camposAusentes), tempoMs: Date.now() - t0 }
}

function fmt(x: number): string { return Number.isInteger(x) ? String(x) : x.toFixed(Math.abs(x) < 1 ? 3 : 2).replace(/\.?0+$/, '') }

/** "2024" < "24/25" < "2025" < "25/26" pela data de início. */
export function ordemTemporada(a: string, b: string): number {
  const ini = (s: string) => { const m = s.match(/^(\d{2})\/(\d{2})$/); if (m) return 2000 + Number(m[1]) + 0.5; const y = Number(s); return Number.isFinite(y) ? y : 0 }
  return ini(a) - ini(b) || a.localeCompare(b)
}
