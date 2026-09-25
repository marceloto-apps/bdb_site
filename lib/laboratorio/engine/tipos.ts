/**
 * Tipos do engine do Backtest Livre (Fase 2 — docs/Backtest_Livre_Plano.md §5).
 *
 * Regra de ouro: nada em `lib/laboratorio/engine` importa Prisma, `next` ou DOM. Tudo é função
 * pura sobre arrays, para rodar igual no Web Worker, em Node (rota/CLI) e nos testes.
 */

// ────────────────────────────────────────────────────────────────────────────
// Dataset em memória (saída do leitor de chunks — lib/laboratorio/data)
// ────────────────────────────────────────────────────────────────────────────

/** Coluna numérica: Float64Array com NaN para nulo (bool = 0/1, date = epoch ms). */
export type ColunaNumerica = Float64Array
/** Coluna de texto/id: null para nulo. */
export type ColunaTexto = (string | null)[]

export interface Dataset {
  /** número de linhas (jogos) */
  n: number
  numericas: Map<string, ColunaNumerica>
  textos: Map<string, ColunaTexto>
  /** versão do dataset (manifest) — vai para o hash do run */
  versao?: string
  catalogoVersao?: string
}

// ────────────────────────────────────────────────────────────────────────────
// Estratégia (JSON persistido; builder visual e modo fórmula geram o mesmo)
// ────────────────────────────────────────────────────────────────────────────

export type Mercado = '1x2' | 'btts' | 'ou' | 'ah' | 'corners' | 'ht_1x2' | 'ht_ou' | 'ht_ah' | 'dc' | 'eh' | 'cs'
export type Casa = 'bet365' | 'pinnacle'
export type Snapshot = 'open' | 'close'
export type TipoCompeticao = 'LEAGUE' | 'CUP' | 'INTERNATIONAL_CLUBS' | 'NATIONAL_TEAMS'

/** Expressão: texto (modo fórmula) ou AST (builder visual). Quando os dois existem, o AST vence. */
export interface Expressao {
  formula?: string
  ast?: unknown
}

export interface Universo {
  /** chaves de competição (`Competition.id` ou `fpt:<rawLeague>`); vazio = todas do dataset */
  competicoes?: string[]
  /** chaves de temporada (`match.season`); vazio = todas */
  temporadas?: string[]
  /** rótulos de temporada ("2025", "24/25"); alternativa às chaves */
  temporadasLabel?: string[]
  /** intervalo de datas (ISO, inclusivo) */
  de?: string
  ate?: string
  /** fontes aceitas; padrão ambas */
  fontes?: ('core' | 'fpt')[]
  tipos?: TipoCompeticao[]
  /** exclui as N primeiras rodadas de cada temporada (match.round <= N) */
  excluirRodadasIniciais?: number
  /** campos que precisam ser não-nulos para o jogo entrar no universo */
  coberturaMinima?: string[]
}

export type SelecaoFixa =
  | 'home' | 'draw' | 'away' | 'over' | 'under' | 'yes' | 'no'
  | '1x' | 'x2' | '12'
  | `${number}_${number}` | 'other'

export interface Entrada {
  id?: string
  mercado: Mercado
  /** seleção fixa ou expressão que devolve um código de seleção (`if(a > b, home, away)`) */
  selecao: SelecaoFixa | Expressao
  /** ou/ah/corners/ht_ou/ht_ah: 'main' (padrão), número fixo ou expressão; eh: inteiro −3..3 */
  linha?: 'main' | number | Expressao
  /** preço de decisão */
  preco: { casa: Casa; snapshot: Snapshot }
  /** preço de liquidação; padrão = preco */
  liquidacao?: { casa: Casa; snapshot: Snapshot }
  /** condição adicional da perna (além da regra global) */
  condicao?: Expressao
  oddMin?: number
  oddMax?: number
  /** fração da margem perdida: odd_eff = 1 + (odd − 1)·(1 − slippage) */
  slippage?: number
  /** multiplicador do stake da perna (padrão 1) */
  stakeMult?: number
}

export type Staking =
  | { metodo: 'flat'; unidade: number }
  | { metodo: 'pct_banco'; pct: number; minimo?: number; maximo?: number }
  | { metodo: 'kelly'; fracao: number; prob: Expressao; cap?: number; minimo?: number }
  | { metodo: 'to_win'; alvo: number; maximo?: number }

export interface Estrategia {
  versao: 1
  nome?: string
  universo?: Universo
  /** parâmetros `$p` das fórmulas */
  parametros?: Record<string, number>
  indicadores?: { nome: string; expressao: Expressao }[]
  /** regra de seleção; ausente = todo o universo */
  regra?: Expressao
  entradas: Entrada[]
  staking: Staking
  bancoInicial?: number
  /** exposição máxima por dia (em unidades do staking) */
  exposicaoMaxDia?: number
  /** interrompe novas apostas quando o drawdown do banco passa desta fração (0..1) */
  stopDrawdown?: number
  /** referência de probabilidade justa para EV/CLV (padrão pinnacle close, fallback bet365) */
  referencia?: { casa: Casa; snapshot: Snapshot }
  /** semente do RNG (bootstrap) */
  seed?: number
  /** nº de reamostras do bootstrap em blocos (0 desliga) */
  bootstrap?: number
}

// ────────────────────────────────────────────────────────────────────────────
// Resultado
// ────────────────────────────────────────────────────────────────────────────

export type Resultado = 'WIN' | 'HALF_WIN' | 'REFUND' | 'HALF_LOSS' | 'LOSS' | 'VOID'

export interface Aposta {
  /** índice da linha no dataset */
  i: number
  entradaId: string
  matchId: string
  data: number
  competicao: string
  temporada: string
  home: string
  away: string
  mercado: Mercado
  selecao: string
  linha: number | null
  /** odd de decisão já com slippage */
  odd: number
  oddLiquidacao: number
  stake: number
  resultado: Resultado
  pnl: number
  /** probabilidade justa de referência (no-vig do fechamento) — NaN sem referência */
  qRef: number
  /** odd de fechamento da mesma seleção/linha na referência (para CLV bruto) */
  oddRef: number
  /** rótulo da referência: 'pinnacle' | 'bet365' (soft) | null */
  refSrc: string | null
  ev: number
  clvBruto: number
  clvNovig: number
  clvPontos: number
  banco: number
  /** valores dos indicadores/campos usados (para a tabela/CSV) */
  extras?: Record<string, number | string | null>
}

export interface Kpis {
  n: number
  turnover: number
  lucro: number
  yield: number
  roiBanco: number
  lucroFlat: number
  yieldFlat: number
  hitRate: number
  wins: number
  halfWins: number
  refunds: number
  halfLosses: number
  losses: number
  voids: number
  oddMedia: number
  oddMediaPonderada: number
  breakEvenHit: number
  profitFactor: number
  payoff: number
}

export interface Drawdown {
  inicio: number
  fundo: number
  fim: number | null
  profundidade: number
  profundidadePct: number
  duracao: number
  recuperacao: number | null
}

export interface Caminho {
  banco: Float64Array
  cumulativo: Float64Array
  underwater: Float64Array
  mdd: number
  mddPct: number
  mddDuracao: number
  mddRecuperacao: number | null
  drawdowns: Drawdown[]
  maiorSequenciaDerrotas: number
  maiorSemNovoMaximo: number
  sharpe: number
  sortino: number
  calmar: number
}

export interface Clv {
  nComRef: number
  evMedio: number
  yieldEsperado: number
  lucroEsperado: number
  esperadoCumulativo: Float64Array
  clvBrutoMedio: number
  clvNovigMedio: number
  clvPontosMedio: number
  beatRate: number
  clvCumulativo: Float64Array
  tClv: number
  refSoft: number
}

export interface Inferencia {
  margemMedia: number
  tYield: number
  pValor: number
  zBuchdahl: number
  nMinimo: number
  ic95Yield: [number, number] | null
  ic95Mdd: [number, number] | null
  ic95Clv: [number, number] | null
  reamostras: number
  amostraPequena: boolean
}

export interface Segmento {
  chave: string
  n: number
  turnover: number
  lucro: number
  yield: number
  hitRate: number
  oddMedia: number
  clvNovigMedio: number
}

export interface Aviso {
  tipo: 'cobertura' | 'amostra' | 'referencia' | 'universo' | 'staking' | 'formula' | 'leakage'
  mensagem: string
  campo?: string
  valor?: number
}

export interface RunResult {
  hash: string
  datasetVersao: string | null
  catalogoVersao: string | null
  engineVersao: string
  nUniverso: number
  nSelecionados: number
  nApostas: number
  kpis: Kpis
  caminho: Caminho
  clv: Clv
  inferencia: Inferencia
  segmentos: Record<string, Segmento[]>
  apostas: Aposta[]
  avisos: Aviso[]
  camposUsados: string[]
  tempoMs: number
}

export const ENGINE_VERSAO = '0.1.0'
