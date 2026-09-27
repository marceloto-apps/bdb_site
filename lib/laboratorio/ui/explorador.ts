/**
 * Explorador de vantagens (modo "Explorar" do Laboratório): cesta de apostas básicas, estatísticas em
 * linguagem de apostador para cruzar, tipos do resultado e a conversão de uma célula em estratégia.
 */
import type { ApostaBasica, CelulaExploracao, Cruzamento, ResultadoExploracao } from '../engine/explorar'
import type { Casa, Entrada, Estrategia, InstrucaoExploracao, Universo } from '../engine/tipos'
import { instrucaoExploracaoSchema } from '../api/schemas'

export interface ApostaCesta { id: string; nome: string; grupo: string; mercado: ApostaBasica['mercado']; selecao: ApostaBasica['selecao']; linha?: ApostaBasica['linha'] }

/** Apostas básicas disponíveis (fechamento). O rótulo final é `${nome} · ${casa}`. */
export const CESTA: ApostaCesta[] = [
  { id: 'h', nome: 'Mandante', grupo: 'Resultado (1X2)', mercado: '1x2', selecao: 'home' },
  { id: 'd', nome: 'Empate', grupo: 'Resultado (1X2)', mercado: '1x2', selecao: 'draw' },
  { id: 'a', nome: 'Visitante', grupo: 'Resultado (1X2)', mercado: '1x2', selecao: 'away' },
  { id: 'o25', nome: 'Over 2.5 gols', grupo: 'Gols', mercado: 'ou', selecao: 'over', linha: 2.5 },
  { id: 'u25', nome: 'Under 2.5 gols', grupo: 'Gols', mercado: 'ou', selecao: 'under', linha: 2.5 },
  { id: 'om', nome: 'Over na linha principal', grupo: 'Gols', mercado: 'ou', selecao: 'over', linha: 'main' },
  { id: 'um', nome: 'Under na linha principal', grupo: 'Gols', mercado: 'ou', selecao: 'under', linha: 'main' },
  { id: 'by', nome: 'Ambas marcam', grupo: 'Ambas marcam', mercado: 'btts', selecao: 'yes' },
  { id: 'bn', nome: 'Ambas não marcam', grupo: 'Ambas marcam', mercado: 'btts', selecao: 'no' },
  { id: 'ahh', nome: 'Handicap asiático mandante', grupo: 'Handicap', mercado: 'ah', selecao: 'home', linha: 'main' },
  { id: 'aha', nome: 'Handicap asiático visitante', grupo: 'Handicap', mercado: 'ah', selecao: 'away', linha: 'main' },
]
export const CESTA_PADRAO = ['h', 'd', 'a', 'o25', 'u25', 'by']

export const ROTULO_CASA_CURTO: Record<Casa, string> = { bet365: 'bet365', pinnacle: 'Pinnacle' }

export function apostasDaCesta(ids: string[], casas: Casa[]): ApostaBasica[] {
  const out: ApostaBasica[] = []
  for (const c of CESTA) if (ids.includes(c.id)) for (const casa of casas) out.push({ rotulo: `${c.nome} · ${ROTULO_CASA_CURTO[casa]}`, mercado: c.mercado, selecao: c.selecao, linha: c.linha, preco: { casa, snapshot: 'close' } })
  return out
}

export interface EstatisticaUI { id: string; rotulo: string; grupo: string; formula: string; descricao: string }

/** Estatísticas para cruzar, em linguagem de apostador; `formula` é a expressão do engine. */
export const ESTATISTICAS: EstatisticaUI[] = [
  { id: 'odd_h', rotulo: 'Odd do mandante (bet365)', grupo: 'Mercado', formula: 'odds.bet365.close.1x2.h', descricao: 'Quanto a bet365 paga no mandante no fechamento. Baixa = favorito.' },
  { id: 'odd_a', rotulo: 'Odd do visitante (bet365)', grupo: 'Mercado', formula: 'odds.bet365.close.1x2.a', descricao: 'Quanto a bet365 paga no visitante no fechamento.' },
  { id: 'fav_h', rotulo: 'Mandante é o favorito', grupo: 'Mercado', formula: 'odds.bet365.close.1x2.h < odds.bet365.close.1x2.a', descricao: 'Sim quando a odd do mandante é menor que a do visitante.' },
  { id: 'linha_gols', rotulo: 'Linha de gols do mercado (Pinnacle)', grupo: 'Mercado', formula: 'odds.pinnacle.close.ou.main_line', descricao: 'Linha principal de over/under: quantos gols o mercado espera.' },
  { id: 'move_h', rotulo: 'Movimento da odd do mandante (Pinnacle)', grupo: 'Mercado', formula: 'derived.pinnacle.move_1x2_h', descricao: 'Fechamento ÷ abertura − 1. Negativo = odd caiu (dinheiro no mandante).' },
  { id: 'forma_h', rotulo: 'Forma do mandante (pontos por jogo, últimos 5)', grupo: 'Forma', formula: 'home.l5.pts_pg', descricao: '3 = venceu todos; 1 = um ponto por jogo.' },
  { id: 'forma_a', rotulo: 'Forma do visitante (pontos por jogo, últimos 5)', grupo: 'Forma', formula: 'away.l5.pts_pg', descricao: 'Mesma medida, para o visitante.' },
  { id: 'forma_dif', rotulo: 'Diferença de forma (mandante − visitante)', grupo: 'Forma', formula: 'home.l5.pts_pg - away.l5.pts_pg', descricao: 'Positivo = mandante em melhor fase.' },
  { id: 'elo_dif', rotulo: 'Diferença de força (Elo mandante − visitante)', grupo: 'Forma', formula: 'home.elo - away.elo', descricao: 'Cada 100 pontos ≈ 64% de chance para o mais forte.' },
  { id: 'gf_h', rotulo: 'Gols marcados pelo mandante (média, últimos 10)', grupo: 'Gols', formula: 'home.l10.gf', descricao: 'Média de gols feitos pelo mandante nos últimos 10 jogos.' },
  { id: 'ga_a', rotulo: 'Gols sofridos pelo visitante (média, últimos 10)', grupo: 'Gols', formula: 'away.l10.ga', descricao: 'Média de gols sofridos pelo visitante nos últimos 10 jogos.' },
  { id: 'xg_h', rotulo: 'xG criado pelo mandante (últimos 10)', grupo: 'xG', formula: 'home.l10.xg_for', descricao: 'Qualidade das chances criadas pelo mandante. Só ligas com xG.' },
  { id: 'xg_jogo', rotulo: 'xG esperado no jogo (mandante + visitante)', grupo: 'xG', formula: 'home.l10.xg_for + away.l10.xg_for', descricao: 'Soma do xG médio criado pelos dois times.' },
  { id: 'liga_gols', rotulo: 'Média de gols da liga na temporada', grupo: 'Liga', formula: 'league.avg_goals', descricao: 'Gols por jogo da competição até a data.' },
  { id: 'liga_mandante', rotulo: '% de vitórias do mandante na liga', grupo: 'Liga', formula: 'league.home_win_pct', descricao: 'Quanto o fator casa pesa naquela liga.' },
  { id: 'rodada', rotulo: 'Rodada', grupo: 'Calendário', formula: 'match.round', descricao: 'Início, meio ou fim da temporada.' },
  { id: 'fds', rotulo: 'Jogo no fim de semana', grupo: 'Calendário', formula: 'match.dow == 0 or match.dow == 6', descricao: 'Sim para sábado e domingo.' },
]

type Nulo<T> = T extends number ? number | null : T extends (infer U)[] ? Nulo<U>[] : T extends object ? { [K in keyof T]: Nulo<T[K]> } : T
export type ResultadoExploracaoUI = Nulo<ResultadoExploracao>
export type CelulaUI = Nulo<CelulaExploracao>

export const chaveCelula = (competicao: string, temporada: string, aposta: string, faixa: number) => `${competicao}|${temporada}|${aposta}|${faixa}`

export function indexarCelulas(r: ResultadoExploracaoUI): Map<string, CelulaUI> {
  const m = new Map<string, CelulaUI>()
  for (const c of r.celulas) m.set(chaveCelula(c.competicao, c.temporada, c.aposta, c.faixa ?? -1), c)
  return m
}

/** Persistência: temporadas com lucro / temporadas com amostra (n ≥ nMin) para uma liga × aposta × faixa. */
export function persistencia(idx: Map<string, CelulaUI>, comp: { key: string; temporadas: string[] }, aposta: string, faixa: number, nMin: number): { positivas: number; total: number } {
  let positivas = 0, total = 0
  for (const t of comp.temporadas) { const c = idx.get(chaveCelula(comp.key, t, aposta, faixa)); if (c && (c.n ?? 0) >= nMin) { total++; if ((c.lucro ?? 0) > 0) positivas++ } }
  return { positivas, total }
}

/** p-valor que uma célula precisa ter para ser significativa a 5% com N células testadas (Šidák). */
export const limiarSidak = (n: number) => (n <= 1 ? 0.05 : 1 - Math.pow(0.95, 1 / n))
/** p deflacionado por N células. */
export const pDeflacionado = (p: number | null, n: number) => (p === null ? null : 1 - Math.pow(1 - p, Math.max(1, n)))

const precisaParenteses = (f: string) => /[+\-*/<>=!]|\band\b|\bor\b|\bnot\b/.test(f)
const paren = (f: string) => (precisaParenteses(f) ? `(${f})` : f)
const numFmt = (x: number) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 1e4) / 1e4))

/** Regra equivalente a uma faixa da estatística. */
export function regraDaFaixa(cruz: Cruzamento, tipo: string | null, faixa: { de: number | null; ate: number | null; rotulo: string }, indice: number): string {
  const f = cruz.formula
  if (tipo === 'bool' || (faixa.rotulo === 'Não' || faixa.rotulo === 'Sim')) return indice === 1 ? f : `not ${paren(f)}`
  const partes: string[] = []
  if (faixa.de !== null) partes.push(`${paren(f)} >= ${numFmt(faixa.de)}`)
  if (faixa.ate !== null) partes.push(`${paren(f)} < ${numFmt(faixa.ate)}`)
  return partes.join(' and ')
}

/** "Serie B (Itália)" — o nome sozinho é ambíguo (há duas Superligas, três Premier Leagues…). */
export const nomeCompeticao = (c: { nome: string; pais?: string | null } | undefined, chave = ''): string => (c ? (c.pais ? `${c.nome} (${c.pais})` : c.nome) : chave)

const VALIDACAO_PADRAO: Estrategia['validacao'] = { holdout: 'selado', folds: 'temporada', walkForward: { janelas: 4, expandindo: true }, monteCarlo: { caminhos: 2000, ruinaPct: 0.5 } }

/** Instrução (marcação) a partir das células marcadas na matriz. */
export function instrucaoDaSelecao(r: ResultadoExploracaoUI, celulas: CelulaUI[], universo: Universo | undefined, apostas: ApostaBasica[], cruz: Cruzamento | null, dataset?: string): InstrucaoExploracao {
  const usadas = new Set(celulas.map((c) => c.aposta))
  const semNulo = (x: number | null | undefined) => (x === null || x === undefined ? undefined : x)
  return {
    v: 1, dataset, geradoEm: new Date().toISOString(),
    universo: universo ? { ...universo } : undefined,
    apostas: apostas.filter((a) => usadas.has(a.rotulo)).map((a) => ({ rotulo: a.rotulo, mercado: a.mercado, selecao: a.selecao, linha: a.linha, preco: a.preco, liquidacao: a.liquidacao })),
    cruzamento: cruz && r.cruzamento ? { rotulo: cruz.rotulo, formula: cruz.formula, tipo: r.cruzamento.tipo } : null,
    faixas: r.faixas.map((f) => ({ rotulo: f.rotulo, de: f.de, ate: f.ate })),
    celulas: celulas.map((c) => {
      const comp = r.competicoes.find((x) => x.key === c.competicao)
      return { competicao: c.competicao, nome: c.competicao === '*' ? 'Todas as ligas' : comp?.nome ?? c.competicao, pais: comp?.pais ?? undefined, temporada: c.temporada, aposta: c.aposta, faixa: c.faixa ?? -1, n: semNulo(c.n), yield: semNulo(c.yield), clv: semNulo(c.clvNovigMedio), p: semNulo(c.pValor) }
    }),
  }
}

const fmtPct = (x: number | undefined) => (x === undefined ? '' : `${(x * 100).toFixed(1).replace('.', ',')}%`)

/** Linhas legíveis da instrução (cabeçalho do texto e resumo na UI). */
export function resumoDaInstrucao(i: InstrucaoExploracao): string[] {
  const linhas = [`Exploração do Laboratório${i.dataset ? ` · dados ${i.dataset}` : ''}${i.geradoEm ? ` · ${new Date(i.geradoEm).toLocaleDateString('pt-BR')}` : ''}`]
  linhas.push(`Apostas: ${i.apostas.map((a) => a.rotulo).join(', ')}`)
  if (i.cruzamento) linhas.push(`Estatística: ${i.cruzamento.rotulo} (${i.cruzamento.formula})`)
  linhas.push(`Marcações (${i.celulas.length}):`)
  for (const c of i.celulas) {
    const faixa = c.faixa >= 0 ? i.faixas?.[c.faixa]?.rotulo ?? `faixa ${c.faixa}` : i.cruzamento ? 'todas as faixas' : ''
    linhas.push(`- ${nomeCompeticao(c, c.competicao)}${c.temporada !== '*' ? ` · ${c.temporada}` : ''} · ${c.aposta}${faixa ? ` · ${faixa}` : ''}${c.n !== undefined ? ` · ${c.n} apostas` : ''}${c.yield !== undefined ? ` · yield ${fmtPct(c.yield)}` : ''}`)
  }
  if (i.nota) linhas.push(`Nota: ${i.nota}`)
  return linhas
}

/** Texto copiável: cabeçalho legível (linhas com #) + JSON. `lerInstrucao` ignora as linhas com #. */
export function textoDaInstrucao(i: InstrucaoExploracao): string {
  return `${resumoDaInstrucao(i).map((l) => `# ${l}`).join('\n')}\n${JSON.stringify(i, null, 2)}`
}

/** Lê o texto colado (aceita só o JSON, ou o texto completo com o cabeçalho). Lança erro legível. */
export function lerInstrucao(texto: string): InstrucaoExploracao {
  const semComentarios = texto.split(/\r?\n/).filter((l) => !l.trim().startsWith('#')).join('\n')
  const a = semComentarios.indexOf('{'), b = semComentarios.lastIndexOf('}')
  if (a < 0 || b <= a) throw new Error('Não encontrei a instrução: cole o texto copiado do modo Explorar (ele termina com um bloco entre chaves).')
  let obj: unknown
  try { obj = JSON.parse(semComentarios.slice(a, b + 1)) } catch { throw new Error('O texto colado não é uma instrução válida (JSON malformado).') }
  const v = instrucaoExploracaoSchema.safeParse(obj)
  if (!v.success) throw new Error(`Instrução inválida: ${v.error.issues[0]?.path.join('.') ?? ''} ${v.error.issues[0]?.message ?? ''}`.trim())
  return v.data as InstrucaoExploracao
}

const semUndefined = <T extends object>(o: T): T => { for (const k of Object.keys(o) as (keyof T)[]) if (o[k] === undefined) delete o[k]; return o }
const aspas = (s: string) => `"${s.replace(/"/g, '')}"`

/**
 * Monta a estratégia (selo fechado, stake flat) a partir de uma instrução: universo = ligas marcadas
 * (ou todas, se houver marcação em "Todas as ligas"); apostas = as usadas nas marcações; regra = faixas
 * marcadas, por liga quando as faixas diferem entre ligas (`match.competition == "…" and …`).
 */
export function estrategiaDaInstrucao(i: InstrucaoExploracao): Estrategia {
  const u: Universo = { ...(i.universo ?? {}) }
  delete u.temporadasExcluidas
  const comps = Array.from(new Set(i.celulas.filter((c) => c.competicao !== '*').map((c) => c.competicao)))
  const todasLigas = i.celulas.some((c) => c.competicao === '*')
  if (!todasLigas && comps.length) u.competicoes = comps; else delete u.competicoes
  const temporadas = new Set(i.celulas.map((c) => c.temporada))
  if (temporadas.size === 1 && !temporadas.has('*')) u.temporadasLabel = [Array.from(temporadas)[0]]; else delete u.temporadasLabel

  const usadas = new Set(i.celulas.map((c) => c.aposta))
  const entradas: Entrada[] = i.apostas.filter((a) => usadas.has(a.rotulo)).map((a, k) => semUndefined({ id: `e${k + 1}`, mercado: a.mercado, selecao: a.selecao, linha: a.linha, preco: a.preco, liquidacao: a.liquidacao }))
  if (!entradas.length) throw new Error('A instrução não tem apostas para as marcações')

  // faixas por competição: null = sem restrição (célula "todas as faixas")
  const cruz = i.cruzamento ?? null
  const faixasDe = (set: Set<number>) => Array.from(set).sort((a, b) => a - b).map((f) => regraDaFaixa(cruz!, cruz!.tipo ?? null, i.faixas![f], f))
  const juntar = (regras: string[]) => (regras.length === 1 ? regras[0] : regras.map((r) => `(${r})`).join(' or '))
  let regra: string | undefined
  if (cruz && i.faixas?.length) {
    const porComp = new Map<string, Set<number> | null>()
    let geral: Set<number> | null | undefined
    for (const c of i.celulas) {
      if (c.competicao === '*') { if (c.faixa < 0 || geral === null) geral = null; else { geral = geral ?? new Set(); geral.add(c.faixa) } continue }
      const atual = porComp.get(c.competicao)
      if (atual === null) continue
      if (c.faixa < 0) porComp.set(c.competicao, null); else { const s = atual ?? new Set<number>(); s.add(c.faixa); porComp.set(c.competicao, s) }
    }
    const sets = Array.from(porComp.values())
    const chaveSet = (s: Set<number> | null) => (s ? Array.from(s).sort().join(',') : '')
    const iguais = sets.length > 0 && sets.every((s) => s && chaveSet(s) === chaveSet(sets[0]))
    const restritas = sets.filter((s) => s)
    if (geral === undefined && iguais) regra = juntar(faixasDe(sets[0] as Set<number>))
    else if (geral !== undefined && sets.length === 0) regra = geral ? juntar(faixasDe(geral)) : undefined
    else if (!restritas.length && !geral) regra = undefined // só "todas as faixas": o universo já restringe as ligas
    else {
      const clausulas: string[] = []
      for (const [k, s] of Array.from(porComp)) clausulas.push(s ? `match.competition == ${aspas(k)} and (${juntar(faixasDe(s))})` : `match.competition == ${aspas(k)}`)
      if (geral) clausulas.push(juntar(faixasDe(geral)))
      if (geral === null) regra = undefined; else regra = clausulas.length === 1 ? clausulas[0] : clausulas.map((c) => `(${c})`).join(' or ')
    }
  }

  const ligas = todasLigas || !comps.length ? 'todas as ligas' : comps.length === 1 ? nomeCompeticao(i.celulas.find((c) => c.competicao === comps[0]), comps[0]) : `${comps.length} ligas`
  const nome = `Exploração: ${entradas.length === 1 ? i.apostas.find((a) => usadas.has(a.rotulo))?.rotulo : `${entradas.length} apostas`} · ${ligas}${cruz && regra ? ` · ${cruz.rotulo}` : ''}`
  return {
    versao: 1, nome: nome.slice(0, 120), universo: u,
    regra: regra ? { formula: regra } : undefined,
    entradas, staking: { metodo: 'flat', unidade: 1 }, bancoInicial: 100, bootstrap: 1000, seed: 42,
    validacao: { ...VALIDACAO_PADRAO }, exploracao: i,
  }
}

/** Monta a estratégia (selo fechado, stake flat) a partir de uma célula: "Levar ao Laboratório". */
export function estrategiaDaCelula(r: ResultadoExploracaoUI, celula: CelulaUI, universo: Universo | undefined, apostas: ApostaBasica[], cruz: Cruzamento | null): Estrategia {
  const aposta = apostas.find((a) => a.rotulo === celula.aposta)
  if (!aposta) throw new Error('Aposta não encontrada')
  const comp = r.competicoes.find((c) => c.key === celula.competicao)
  const u: Universo = { ...(universo ?? {}) }
  if (celula.competicao !== '*') { u.competicoes = [celula.competicao]; delete u.temporadasExcluidas }
  if (celula.temporada !== '*') u.temporadasLabel = [celula.temporada]
  const faixa = (celula.faixa ?? -1) >= 0 ? r.faixas[celula.faixa as number] : null
  const regra = cruz && faixa ? regraDaFaixa(cruz, r.cruzamento?.tipo ?? null, faixa, celula.faixa as number) : ''
  const nome = `${celula.aposta} · ${celula.competicao === '*' ? 'todas as ligas' : nomeCompeticao(comp, celula.competicao)}${celula.temporada !== '*' ? ` ${celula.temporada}` : ''}${faixa ? ` · ${cruz?.rotulo} ${faixa.rotulo}` : ''}`
  return {
    versao: 1, nome: nome.slice(0, 120), universo: u,
    regra: regra ? { formula: regra } : undefined,
    entradas: [{ id: 'e1', mercado: aposta.mercado, selecao: aposta.selecao, linha: aposta.linha, preco: aposta.preco }],
    staking: { metodo: 'flat', unidade: 1 }, bancoInicial: 100, bootstrap: 1000, seed: 42,
    validacao: { ...VALIDACAO_PADRAO },
    exploracao: instrucaoDaSelecao(r, [celula], universo, apostas, cruz, r.datasetVersao ?? undefined),
  }
}
