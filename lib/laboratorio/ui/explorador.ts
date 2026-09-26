/**
 * Explorador de vantagens (modo "Explorar" do Laboratório): cesta de apostas básicas, estatísticas em
 * linguagem de apostador para cruzar, tipos do resultado e a conversão de uma célula em estratégia.
 */
import type { ApostaBasica, CelulaExploracao, Cruzamento, ResultadoExploracao } from '../engine/explorar'
import type { Casa, Estrategia, Universo } from '../engine/tipos'

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
  const nome = `${celula.aposta} · ${celula.competicao === '*' ? 'todas as ligas' : comp?.nome ?? celula.competicao}${celula.temporada !== '*' ? ` ${celula.temporada}` : ''}${faixa ? ` · ${cruz?.rotulo} ${faixa.rotulo}` : ''}`
  return {
    versao: 1, nome: nome.slice(0, 120), universo: u,
    regra: regra ? { formula: regra } : undefined,
    entradas: [{ id: 'e1', mercado: aposta.mercado, selecao: aposta.selecao, linha: aposta.linha, preco: aposta.preco }],
    staking: { metodo: 'flat', unidade: 1 }, bancoInicial: 100, bootstrap: 1000, seed: 42,
    validacao: { holdout: 'selado', folds: 'temporada', walkForward: { janelas: 4, expandindo: true }, monteCarlo: { caminhos: 2000, ruinaPct: 0.5 } },
  }
}
