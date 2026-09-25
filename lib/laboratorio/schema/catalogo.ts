/**
 * Catálogo de campos v1 do Backtest Livre (Fase 0).
 * docs/Backtest_Livre_Plano.md §4.2.
 *
 * O catálogo é gerado por templates para não listar ~1.300 colunas à mão. Cada campo tem:
 *  - key: nome usado nas fórmulas (`home.l10.xg_for`, `odds.pinnacle.close.1x2.h`)
 *  - tipo: unidade semântica (o validador de expressões usa para impedir `odd > prob`)
 *  - bloco: match | odds | derived | team | league
 *  - fontes: em ordem de precedência (primeira que existir vence)
 *  - cobertura: estimativa por fonte (0..1) a partir das medições de 24/09/2026; a medida
 *    exata por liga×temporada sai de `bt_coverage` na Fase 1.
 *
 * Princípio: catálogo largo, chunk esparso, decodificação preguiçosa. Coluna ausente numa
 * liga não ocupa espaço no chunk e vira `null` no engine.
 */

export type TipoCampo =
  | 'odd' | 'prob' | 'line' | 'count' | 'rate' | 'pct' | 'goals' | 'xg' | 'days' | 'points'
  | 'bool' | 'int' | 'id' | 'date' | 'text' | 'ratio' | 'elo'

export type Fonte = 'core' | 'fpt' | 'fs'
export type Bloco = 'match' | 'odds' | 'derived' | 'team' | 'league'

export interface Campo {
  key: string
  label: string
  tipo: TipoCampo
  bloco: Bloco
  fontes: Fonte[]
  descricao: string
  cobertura?: Partial<Record<Fonte, number>>
  /** Ano a partir do qual a fonte tem o campo (ex.: xG na FPT só de 2023) */
  desde?: Partial<Record<Fonte, number>>
  /** Campo calculado no engine (não armazenado) */
  virtual?: boolean
}

// ────────────────────────────────────────────────────────────────────────────
// Vocabulário
// ────────────────────────────────────────────────────────────────────────────

export const SNAPSHOTS = ['open', 'close'] as const
/** Reservados para quando `odds_movements` deixar de ser expurgado (D3): 'd1' | 'h6' | 'h1' */
export const SNAPSHOTS_FUTUROS = ['d1', 'h6', 'h1'] as const

/** Casas com largura total de mercados */
export const CASAS_COMPLETAS = ['pinnacle', 'bet365', 'avg', 'best'] as const
/** Casas com largura reduzida (1X2, BTTS, O/U principal, AH principal) */
export const CASAS_REDUZIDAS = [
  'betano', 'betfair', 'kambi', 'superbet', '1xbet', 'estrela_bet', 'f12', 'sportingbet', 'kto', 'betnacional',
] as const
export type Casa = (typeof CASAS_COMPLETAS)[number] | (typeof CASAS_REDUZIDAS)[number]

/**
 * Casas ATIVAS no catálogo v1 (decisão D11, 25/09/2026): só bet365 e Pinnacle. As demais continuam
 * definidas em CASAS_COMPLETAS/CASAS_REDUZIDAS e em `fontesOdds`, mas não geram campos até entrarem
 * nesta lista. Ligar uma casa = adicionar aqui, regenerar o catálogo e subir `CATALOGO_VERSAO`.
 * `avg`/`best` só fazem sentido com ≥ 3 casas ativas.
 */
export const CASAS_ATIVAS: readonly Casa[] = ['pinnacle', 'bet365'] as const
export const CASAS_INATIVAS: readonly Casa[] = [...CASAS_COMPLETAS, ...CASAS_REDUZIDAS].filter((c) => !CASAS_ATIVAS.includes(c))

export const LADOS = ['home', 'away'] as const
export const ESCOPOS = ['all', 'venue'] as const
export const JANELAS = ['l5', 'l10', 'l20', 'season'] as const

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const c = (
  key: string, label: string, tipo: TipoCampo, bloco: Bloco, fontes: Fonte[], descricao: string,
  extra: Partial<Campo> = {},
): Campo => ({ key, label, tipo, bloco, fontes, descricao, ...extra })

/** Fontes de odds por casa: onde a casa existe e em que ordem de precedência. */
function fontesOdds(casa: Casa, snapshot: 'open' | 'close'): { fontes: Fonte[]; cobertura: Partial<Record<Fonte, number>>; desde?: Partial<Record<Fonte, number>> } {
  switch (casa) {
    case 'pinnacle':
      return { fontes: ['core'], cobertura: { core: snapshot === 'close' ? 0.6 : 0.45 } }
    case 'bet365':
      return snapshot === 'close'
        ? { fontes: ['fs', 'core', 'fpt'], cobertura: { fs: 0.85, core: 0.95, fpt: 0.95 }, desde: { fs: 2024 } }
        : { fontes: ['fs', 'core'], cobertura: { fs: 0.85, core: 0.5 }, desde: { fs: 2024 } }
    case 'betano':
      return { fontes: ['fs', 'core'], cobertura: { fs: 0.85, core: 0.1 }, desde: { fs: 2024, core: 2026 } }
    case 'betfair':
      return { fontes: ['fs', 'core'], cobertura: { fs: 0.8, core: 0.3 }, desde: { fs: 2024 } }
    case 'kambi':
      return { fontes: ['core'], cobertura: { core: 0.2 } }
    case 'avg':
    case 'best':
      return { fontes: ['fs', 'core'], cobertura: { fs: 0.85, core: 0.95 } }
    default:
      // casas exclusivas do Flashscore
      return { fontes: ['fs'], cobertura: { fs: 0.8 }, desde: { fs: 2024 } }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Bloco MATCH
// ────────────────────────────────────────────────────────────────────────────

const CAMPOS_MATCH: Campo[] = [
  c('match.id', 'ID da partida', 'id', 'match', ['core', 'fpt'], '`matches.id` ou `fpt:<fpt_match.id>`'),
  c('match.competition', 'Competição', 'id', 'match', ['core', 'fpt'], '`Competition.id` ou `fpt:<rawLeague>`'),
  c('match.competition_level', 'Nível da competição', 'int', 'match', ['core', 'fpt'], '1 = elite; null para copas e torneios internacionais'),
  c('match.competition_type', 'Tipo da competição', 'text', 'match', ['core', 'fpt'], 'LEAGUE | CUP | INTERNATIONAL_CLUBS | NATIONAL_TEAMS'),
  c('match.country', 'País', 'text', 'match', ['core', 'fpt'], 'pt-BR, padrão de `Competition.country`'),
  c('match.season', 'Temporada', 'id', 'match', ['core', 'fpt'], '`Season.id` ou temporada da FPT'),
  c('match.season_label', 'Rótulo da temporada', 'text', 'match', ['core', 'fpt'], '"2025" ou "24/25"'),
  c('match.round', 'Rodada', 'int', 'match', ['core', 'fpt'], 'Rodada oficial quando existe', { cobertura: { core: 0.99, fpt: 0.6 } }),
  c('match.utc_date', 'Data/hora (UTC)', 'date', 'match', ['core', 'fpt'], 'Núcleo em UTC; FPT em hora local sem fuso (ver tz_uncertain)'),
  c('match.tz_uncertain', 'Fuso incerto', 'bool', 'match', ['fpt'], 'true quando a hora veio só da FPT'),
  c('match.dow', 'Dia da semana', 'int', 'match', ['core', 'fpt'], '0 = domingo … 6 = sábado'),
  c('match.hour_local', 'Hora local', 'int', 'match', ['core', 'fpt'], 'Hora local do jogo (null se tz_uncertain)'),
  c('match.home', 'Mandante', 'id', 'match', ['core', 'fpt'], '`teams.id` ou `fpt:<nome>` provisório (D10)'),
  c('match.away', 'Visitante', 'id', 'match', ['core', 'fpt'], '`teams.id` ou `fpt:<nome>` provisório (D10)'),
  c('match.home_provisional', 'Mandante sem vínculo', 'bool', 'match', ['fpt'], 'true quando o mandante ainda não está em `teams`'),
  c('match.away_provisional', 'Visitante sem vínculo', 'bool', 'match', ['fpt'], 'true quando o visitante ainda não está em `teams`'),
  c('match.ft_h', 'Gols mandante (FT)', 'goals', 'match', ['core', 'fpt'], 'Placar final — só para liquidação, nunca em regra', { cobertura: { core: 1, fpt: 1 } }),
  c('match.ft_a', 'Gols visitante (FT)', 'goals', 'match', ['core', 'fpt'], 'Placar final — só para liquidação, nunca em regra', { cobertura: { core: 1, fpt: 1 } }),
  c('match.ht_h', 'Gols mandante (HT)', 'goals', 'match', ['core', 'fpt'], 'Placar de intervalo — só para liquidação', { cobertura: { core: 0.73, fpt: 1 } }),
  c('match.ht_a', 'Gols visitante (HT)', 'goals', 'match', ['core', 'fpt'], 'Placar de intervalo — só para liquidação', { cobertura: { core: 0.73, fpt: 1 } }),
  c('match.corners_h', 'Escanteios mandante', 'count', 'match', ['core', 'fpt'], 'Só para liquidação de mercados de escanteios', { cobertura: { core: 0.96, fpt: 0.62 } }),
  c('match.corners_a', 'Escanteios visitante', 'count', 'match', ['core', 'fpt'], 'Só para liquidação de mercados de escanteios', { cobertura: { core: 0.96, fpt: 0.62 } }),
  c('match.has_xg', 'Tem xG', 'bool', 'match', ['core', 'fpt'], 'xG disponível no jogo (para cobertura, não para regra)'),
  c('match.has_ht', 'Tem placar HT', 'bool', 'match', ['core', 'fpt'], ''),
  c('match.referee', 'Árbitro', 'text', 'match', ['core'], '', { cobertura: { core: 0.59 } }),
  c('match.src_core', 'Presente no núcleo', 'bool', 'match', ['core'], ''),
  c('match.src_fpt', 'Presente na FPT', 'bool', 'match', ['fpt'], ''),
  c('match.src_fs', 'Presente no Flashscore', 'bool', 'match', ['fs'], ''),
  c('match.n_sources', 'Nº de fontes', 'int', 'match', ['core', 'fpt', 'fs'], ''),
  c('match.stats_src', 'Fonte das estatísticas', 'text', 'match', ['core', 'fpt'], 'core | fpt | none'),
  c('match.odds_close_src', 'Fonte do fechamento', 'text', 'match', ['fs', 'core', 'fpt'], 'fs | core | fpt | none'),
  c('match.odds_open_src', 'Fonte da abertura', 'text', 'match', ['fs', 'core'], 'fs | core | none'),
]

// ────────────────────────────────────────────────────────────────────────────
// Bloco ODDS (por casa × snapshot × mercado)
// ────────────────────────────────────────────────────────────────────────────

interface MercadoTpl { sufixo: string; label: string; tipo: TipoCampo; descricao?: string }

const M_1X2: MercadoTpl[] = [
  { sufixo: '1x2.h', label: '1X2 mandante', tipo: 'odd' },
  { sufixo: '1x2.d', label: '1X2 empate', tipo: 'odd' },
  { sufixo: '1x2.a', label: '1X2 visitante', tipo: 'odd' },
  { sufixo: '1x2.overround', label: '1X2 margem', tipo: 'pct', descricao: 'Σ 1/odd − 1' },
  { sufixo: '1x2.novig_h', label: '1X2 prob. justa mandante', tipo: 'prob', descricao: 'Remoção proporcional da margem' },
  { sufixo: '1x2.novig_d', label: '1X2 prob. justa empate', tipo: 'prob' },
  { sufixo: '1x2.novig_a', label: '1X2 prob. justa visitante', tipo: 'prob' },
]
const M_BTTS: MercadoTpl[] = [
  { sufixo: 'btts.yes', label: 'Ambos marcam sim', tipo: 'odd' },
  { sufixo: 'btts.no', label: 'Ambos marcam não', tipo: 'odd' },
  { sufixo: 'btts.overround', label: 'BTTS margem', tipo: 'pct' },
]
const M_OU_MAIN: MercadoTpl[] = [
  { sufixo: 'ou.main_line', label: 'O/U linha principal', tipo: 'line', descricao: 'Linha com odds mais equilibradas' },
  { sufixo: 'ou.over_main', label: 'Over na linha principal', tipo: 'odd' },
  { sufixo: 'ou.under_main', label: 'Under na linha principal', tipo: 'odd' },
  { sufixo: 'ou.novig_over_main', label: 'Prob. justa over principal', tipo: 'prob' },
]
const M_OU_FIXAS: MercadoTpl[] = ['0_5', '1_5', '2_5', '3_5', '4_5'].flatMap((l) => [
  { sufixo: `ou.over_${l}`, label: `Over ${l.replace('_', '.')}`, tipo: 'odd' as TipoCampo },
  { sufixo: `ou.under_${l}`, label: `Under ${l.replace('_', '.')}`, tipo: 'odd' as TipoCampo },
])
const M_AH_MAIN: MercadoTpl[] = [
  { sufixo: 'ah.main_line', label: 'AH linha principal', tipo: 'line', descricao: 'Do ponto de vista do mandante' },
  { sufixo: 'ah.home_main', label: 'AH mandante (principal)', tipo: 'odd' },
  { sufixo: 'ah.away_main', label: 'AH visitante (principal)', tipo: 'odd' },
]
const M_CORNERS: MercadoTpl[] = [
  { sufixo: 'corners.main_line', label: 'Escanteios linha principal', tipo: 'line' },
  { sufixo: 'corners.over_main', label: 'Escanteios over', tipo: 'odd' },
  { sufixo: 'corners.under_main', label: 'Escanteios under', tipo: 'odd' },
]
const M_HT_1X2: MercadoTpl[] = [
  { sufixo: 'ht_1x2.h', label: '1X2 1º tempo mandante', tipo: 'odd' },
  { sufixo: 'ht_1x2.d', label: '1X2 1º tempo empate', tipo: 'odd' },
  { sufixo: 'ht_1x2.a', label: '1X2 1º tempo visitante', tipo: 'odd' },
]
const M_HT_OU: MercadoTpl[] = [
  { sufixo: 'ht_ou.main_line', label: 'O/U 1º tempo linha principal', tipo: 'line' },
  { sufixo: 'ht_ou.over_main', label: 'Over 1º tempo principal', tipo: 'odd' },
  { sufixo: 'ht_ou.under_main', label: 'Under 1º tempo principal', tipo: 'odd' },
  ...['0_5', '1_5', '2_5'].flatMap((l) => [
    { sufixo: `ht_ou.over_${l}`, label: `Over ${l.replace('_', '.')} 1º tempo`, tipo: 'odd' as TipoCampo },
    { sufixo: `ht_ou.under_${l}`, label: `Under ${l.replace('_', '.')} 1º tempo`, tipo: 'odd' as TipoCampo },
  ]),
]
const M_HT_AH: MercadoTpl[] = [
  { sufixo: 'ht_ah.main_line', label: 'AH 1º tempo linha principal', tipo: 'line' },
  { sufixo: 'ht_ah.home_main', label: 'AH 1º tempo mandante', tipo: 'odd' },
  { sufixo: 'ht_ah.away_main', label: 'AH 1º tempo visitante', tipo: 'odd' },
]
const M_DC: MercadoTpl[] = [
  { sufixo: 'dc.1x', label: 'Dupla chance 1X', tipo: 'odd' },
  { sufixo: 'dc.x2', label: 'Dupla chance X2', tipo: 'odd' },
  { sufixo: 'dc.12', label: 'Dupla chance 12', tipo: 'odd' },
]
const M_EH: MercadoTpl[] = ['m1', 'm2', 'm3', 'p1', 'p2', 'p3'].flatMap((h) => {
  const hl = h.replace('m', '−').replace('p', '+')
  return [
    { sufixo: `eh.h_${h}`, label: `Handicap europeu ${hl} mandante`, tipo: 'odd' as TipoCampo },
    { sufixo: `eh.d_${h}`, label: `Handicap europeu ${hl} empate`, tipo: 'odd' as TipoCampo },
    { sufixo: `eh.a_${h}`, label: `Handicap europeu ${hl} visitante`, tipo: 'odd' as TipoCampo },
  ]
})
const M_CS: MercadoTpl[] = [
  ...[0, 1, 2, 3].flatMap((h) => [0, 1, 2, 3].map((a) => ({ sufixo: `cs.${h}_${a}`, label: `Placar exato ${h}-${a}`, tipo: 'odd' as TipoCampo }))),
  { sufixo: 'cs.other', label: 'Placar exato outro', tipo: 'odd' },
]

/** Quais mercados cada casa tem, por fonte real. */
function mercadosDaCasa(casa: Casa): MercadoTpl[] {
  switch (casa) {
    case 'pinnacle':
      return [...M_1X2, ...M_BTTS, ...M_OU_MAIN, ...M_OU_FIXAS, ...M_AH_MAIN, ...M_CORNERS]
    case 'bet365':
      return [...M_1X2, ...M_BTTS, ...M_OU_MAIN, ...M_OU_FIXAS, ...M_AH_MAIN, ...M_CORNERS, ...M_HT_1X2, ...M_HT_OU, ...M_HT_AH, ...M_DC, ...M_EH, ...M_CS]
    case 'avg':
    case 'best':
      return [...M_1X2, ...M_BTTS, ...M_OU_MAIN, ...M_AH_MAIN, ...M_HT_1X2, ...M_HT_OU.slice(0, 3)]
    default:
      return [...M_1X2.slice(0, 4), ...M_BTTS.slice(0, 2), ...M_OU_MAIN.slice(0, 3), ...M_AH_MAIN]
  }
}

/** Mercados que só existem no fechamento da bet365 vindo da FPT (sem abertura). */
const SO_FECHAMENTO_FPT = new Set(['dc', 'eh', 'cs'])

function gerarOdds(): Campo[] {
  const out: Campo[] = []
  for (const casa of CASAS_ATIVAS) {
    for (const snap of SNAPSHOTS) {
      const base = fontesOdds(casa, snap)
      for (const m of mercadosDaCasa(casa)) {
        const mercado = m.sufixo.split('.')[0]
        let fontes = base.fontes
        let cobertura = base.cobertura
        if (SO_FECHAMENTO_FPT.has(mercado)) {
          if (snap === 'open') continue
          fontes = mercado === 'dc' ? ['fs', 'fpt'] : ['fpt']
          cobertura = mercado === 'dc' ? { fs: 0.85, fpt: 0.95 } : { fpt: mercado === 'cs' ? 0.93 : 0.75 }
        } else if (mercado.startsWith('ht_')) {
          fontes = base.fontes.filter((f) => f !== 'core')
          if (mercado === 'ht_ah') fontes = fontes.filter((f) => f !== 'fpt')
          cobertura = Object.fromEntries(fontes.map((f) => [f, base.cobertura[f] ?? 0.8]))
          if (fontes.length === 0) continue
        } else if (mercado === 'corners') {
          fontes = ['core']
          cobertura = { core: casa === 'pinnacle' ? 0.5 : 0.4 }
        }
        out.push(c(
          `odds.${casa}.${snap}.${m.sufixo}`,
          `${m.label} — ${casa} ${snap === 'open' ? 'abertura' : 'fechamento'}`,
          m.tipo, 'odds', fontes,
          m.descricao ?? '',
          { cobertura, desde: base.desde },
        ))
      }
    }
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// Bloco DERIVED (odds cruzadas, prontos no chunk)
// ────────────────────────────────────────────────────────────────────────────

function gerarDerivados(): Campo[] {
  const out: Campo[] = []
  for (const casa of (['pinnacle', 'bet365'] as const).filter((c) => CASAS_ATIVAS.includes(c))) {
    const f: Fonte[] = casa === 'pinnacle' ? ['core'] : ['fs', 'core']
    out.push(
      c(`derived.${casa}.move_1x2_h`, `Movimento 1X2 mandante (${casa})`, 'ratio', 'derived', f, 'close/open − 1'),
      c(`derived.${casa}.move_1x2_d`, `Movimento 1X2 empate (${casa})`, 'ratio', 'derived', f, 'close/open − 1'),
      c(`derived.${casa}.move_1x2_a`, `Movimento 1X2 visitante (${casa})`, 'ratio', 'derived', f, 'close/open − 1'),
      c(`derived.${casa}.move_novig_h`, `Δ prob. justa mandante (${casa})`, 'prob', 'derived', f, 'novig_h(close) − novig_h(open), em pontos de probabilidade'),
      c(`derived.${casa}.move_ou_over_main`, `Movimento over principal (${casa})`, 'ratio', 'derived', f, 'close/open − 1 na mesma linha; null se a linha mudou'),
      c(`derived.${casa}.line_shift_ou`, `Deslocamento da linha O/U (${casa})`, 'line', 'derived', f, 'main_line(close) − main_line(open)'),
      c(`derived.${casa}.line_shift_ah`, `Deslocamento da linha AH (${casa})`, 'line', 'derived', f, 'main_line(close) − main_line(open)'),
      c(`derived.${casa}.fav_side`, `Favorito (${casa})`, 'text', 'derived', f, 'home | away pela menor odd de fechamento'),
      c(`derived.${casa}.fav_odd`, `Odd do favorito (${casa})`, 'odd', 'derived', f, ''),
      c(`derived.${casa}.odd_gap`, `Gap de odds (${casa})`, 'ratio', 'derived', f, 'odd_a − odd_h no fechamento'),
      c(`derived.${casa}.market_lambda_h`, `λ mandante implícito (${casa})`, 'xg', 'derived', f, 'Via calibrarLambdas (1X2 + O/U 2.5 sem margem)'),
      c(`derived.${casa}.market_lambda_a`, `λ visitante implícito (${casa})`, 'xg', 'derived', f, 'Via calibrarLambdas'),
      c(`derived.${casa}.market_total`, `Total implícito (${casa})`, 'xg', 'derived', f, 'λ_h + λ_a'),
    )
  }
  if (CASAS_ATIVAS.includes('pinnacle') && CASAS_ATIVAS.includes('bet365')) {
    out.push(
      c('derived.pinnacle_vs_bet365.edge_h', 'Edge bet365 vs Pinnacle mandante', 'ratio', 'derived', ['fs', 'core'], 'bet365.close.1x2.h × pinnacle.close.novig_h − 1'),
      c('derived.pinnacle_vs_bet365.edge_d', 'Edge bet365 vs Pinnacle empate', 'ratio', 'derived', ['fs', 'core'], ''),
      c('derived.pinnacle_vs_bet365.edge_a', 'Edge bet365 vs Pinnacle visitante', 'ratio', 'derived', ['fs', 'core'], ''),
      c('derived.pinnacle_vs_bet365.edge_over_main', 'Edge bet365 vs Pinnacle over principal', 'ratio', 'derived', ['fs', 'core'], 'Só quando as linhas principais coincidem'),
      c('derived.pinnacle_vs_bet365.edge_open_h', 'Edge bet365 abertura vs Pinnacle fechamento mandante', 'ratio', 'derived', ['fs', 'core'], 'bet365.open.1x2.h × pinnacle.close.novig_h − 1 (o "CLV disponível na abertura")'),
    )
  }
  if (CASAS_ATIVAS.includes('best')) {
    out.push(c('derived.best_vs_pinnacle.edge_h', 'Edge melhor odd vs Pinnacle mandante', 'ratio', 'derived', ['fs', 'core'], 'Cenário otimista (rotulado)'))
  }
  out.push(
    c('derived.n_books_close', 'Nº de casas ativas com fechamento', 'int', 'derived', ['fs', 'core', 'fpt'], ''),
    c('derived.n_books_open', 'Nº de casas ativas com abertura', 'int', 'derived', ['fs', 'core'], ''),
  )
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// Bloco TEAM (lado × escopo × janela × estatística)
// ────────────────────────────────────────────────────────────────────────────

interface StatTpl { sufixo: string; label: string; tipo: TipoCampo; fontes: Fonte[]; cobertura: Partial<Record<Fonte, number>>; desde?: Partial<Record<Fonte, number>>; descricao?: string }

const COB_GOLS = { core: 1, fpt: 1 }
const COB_HT = { core: 0.73, fpt: 1 }
const COB_VOL = { core: 0.96, fpt: 0.62 }
const COB_XG = { core: 0.8, fpt: 0.3 }
const COB_XG1H = { core: 0.44, fpt: 0.3 }
const COB_BIG = { core: 0.91, fpt: 0.25 }
const CF: Fonte[] = ['core', 'fpt']

const STATS_TIME: StatTpl[] = [
  { sufixo: 'gf', label: 'Gols marcados (média)', tipo: 'goals', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'ga', label: 'Gols sofridos (média)', tipo: 'goals', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'gd', label: 'Saldo de gols (média)', tipo: 'goals', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'pts_pg', label: 'Pontos por jogo', tipo: 'points', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'win_pct', label: '% vitórias', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'draw_pct', label: '% empates', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'loss_pct', label: '% derrotas', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'btts_pct', label: '% ambos marcam', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'over15_pct', label: '% over 1.5', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'over25_pct', label: '% over 2.5', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'over35_pct', label: '% over 3.5', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'cs_pct', label: '% sem sofrer gol', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'fts_pct', label: '% sem marcar', tipo: 'pct', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'ht_gf', label: 'Gols marcados 1º tempo (média)', tipo: 'goals', fontes: CF, cobertura: COB_HT },
  { sufixo: 'ht_ga', label: 'Gols sofridos 1º tempo (média)', tipo: 'goals', fontes: CF, cobertura: COB_HT },
  { sufixo: 'ht_lead_pct', label: '% em vantagem no intervalo', tipo: 'pct', fontes: CF, cobertura: COB_HT },
  { sufixo: 'xg_for', label: 'xG criado (média)', tipo: 'xg', fontes: CF, cobertura: COB_XG, desde: { fpt: 2023 } },
  { sufixo: 'xg_against', label: 'xG sofrido (média)', tipo: 'xg', fontes: CF, cobertura: COB_XG, desde: { fpt: 2023 } },
  { sufixo: 'xg_diff', label: 'Saldo de xG (média)', tipo: 'xg', fontes: CF, cobertura: COB_XG, desde: { fpt: 2023 } },
  { sufixo: 'xg_perf', label: 'Gols − xG (média)', tipo: 'xg', fontes: CF, cobertura: COB_XG, desde: { fpt: 2023 }, descricao: 'Positivo = converte acima do esperado' },
  { sufixo: 'xga_perf', label: 'Gols sofridos − xG sofrido (média)', tipo: 'xg', fontes: CF, cobertura: COB_XG, desde: { fpt: 2023 } },
  { sufixo: 'xg_1h_for', label: 'xG criado 1º tempo (média)', tipo: 'xg', fontes: CF, cobertura: COB_XG1H, desde: { fpt: 2023 } },
  { sufixo: 'shots_for', label: 'Chutes (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'shots_against', label: 'Chutes sofridos (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'sot_for', label: 'Chutes no alvo (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'sot_against', label: 'Chutes no alvo sofridos (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'sot_pct', label: '% chutes no alvo', tipo: 'pct', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'conv_pct', label: '% conversão (gols/chutes)', tipo: 'pct', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'shots_inbox_for', label: 'Chutes na área (média)', tipo: 'count', fontes: CF, cobertura: { core: 0.96, fpt: 0.25 }, desde: { fpt: 2025 } },
  { sufixo: 'big_chances_for', label: 'Grandes chances (média)', tipo: 'count', fontes: CF, cobertura: COB_BIG, desde: { fpt: 2025 } },
  { sufixo: 'big_chances_against', label: 'Grandes chances cedidas (média)', tipo: 'count', fontes: CF, cobertura: COB_BIG, desde: { fpt: 2025 } },
  { sufixo: 'corners_for', label: 'Escanteios (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'corners_against', label: 'Escanteios cedidos (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'possession', label: 'Posse (média %)', tipo: 'pct', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'pass_acc', label: 'Precisão de passe (média %)', tipo: 'pct', fontes: CF, cobertura: { core: 0.96, fpt: 0.25 } },
  { sufixo: 'touches_pa', label: 'Toques na área (média)', tipo: 'count', fontes: ['core', 'fpt'], cobertura: { core: 0.93, fpt: 0.25 } },
  { sufixo: 'fouls', label: 'Faltas (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'yc', label: 'Cartões amarelos (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'rc', label: 'Cartões vermelhos (média)', tipo: 'count', fontes: CF, cobertura: COB_VOL },
  { sufixo: 'cv_goals', label: 'CV dos gols marcados', tipo: 'ratio', fontes: CF, cobertura: COB_GOLS, descricao: 'desvio-padrão / média' },
  { sufixo: 'std_gf', label: 'Desvio-padrão dos gols marcados', tipo: 'goals', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'n_used', label: 'Jogos usados na janela', tipo: 'int', fontes: CF, cobertura: COB_GOLS, descricao: 'Para filtro de amostra mínima' },
]

const STATS_TIME_SEM_JANELA: StatTpl[] = [
  { sufixo: 'form5_pts', label: 'Pontos nos últimos 5', tipo: 'points', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'form5', label: 'Forma (VEDVV)', tipo: 'text', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'streak_win', label: 'Sequência de vitórias', tipo: 'int', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'streak_unbeaten', label: 'Sequência invicta', tipo: 'int', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'streak_scoring', label: 'Sequência marcando', tipo: 'int', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'streak_btts', label: 'Sequência de ambos marcam', tipo: 'int', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'elo', label: 'Elo', tipo: 'elo', fontes: CF, cobertura: COB_GOLS, descricao: 'Rating Elo atualizado jogo a jogo, K fixo, ponto inicial 1500 por liga (P1)' },
  { sufixo: 'rest_days', label: 'Dias de descanso', tipo: 'days', fontes: CF, cobertura: COB_GOLS, descricao: 'Dias desde o último jogo em qualquer competição conhecida' },
  { sufixo: 'matches_last_7d', label: 'Jogos nos últimos 7 dias', tipo: 'int', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'matches_last_30d', label: 'Jogos nos últimos 30 dias', tipo: 'int', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'season_matches_played', label: 'Jogos na temporada', tipo: 'int', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'table_pos', label: 'Posição na tabela', tipo: 'int', fontes: CF, cobertura: COB_GOLS, descricao: 'Classificação recalculada até a data (só LEAGUE)' },
  { sufixo: 'table_pts', label: 'Pontos na tabela', tipo: 'points', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'table_pts_gap_top', label: 'Distância para o líder', tipo: 'points', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'table_pts_gap_bottom', label: 'Distância para o lanterna', tipo: 'points', fontes: CF, cobertura: COB_GOLS },
  { sufixo: 'clv_hist_l10', label: 'CLV histórico (10 jogos)', tipo: 'ratio', fontes: ['fs', 'core'], cobertura: { fs: 0.85, core: 0.5 }, descricao: 'Média de open/close − 1 da odd do próprio time nos últimos 10 jogos (positivo = o time vinha encurtando)' },
  { sufixo: 'fav_pct_l10', label: '% de vezes favorito (10 jogos)', tipo: 'pct', fontes: ['fs', 'core', 'fpt'], cobertura: { core: 0.95, fpt: 0.95 } },
  { sufixo: 'fav_win_pct_l10', label: '% vitórias quando favorito (10 jogos)', tipo: 'pct', fontes: ['fs', 'core', 'fpt'], cobertura: { core: 0.95, fpt: 0.95 } },
  { sufixo: 'avg_odd_l10', label: 'Odd média do time (10 jogos)', tipo: 'odd', fontes: ['fs', 'core', 'fpt'], cobertura: { core: 0.95, fpt: 0.95 }, descricao: 'Odd de fechamento bet365 do time em cada jogo' },
  { sufixo: 'roi_flat_l10', label: 'ROI apostando no time (10 jogos)', tipo: 'pct', fontes: ['fs', 'core', 'fpt'], cobertura: { core: 0.95, fpt: 0.95 } },
]

function gerarTime(): Campo[] {
  const out: Campo[] = []
  for (const lado of LADOS) {
    const ladoLabel = lado === 'home' ? 'Mandante' : 'Visitante'
    for (const escopo of ESCOPOS) {
      const escLabel = escopo === 'all' ? 'todos os jogos' : lado === 'home' ? 'só em casa' : 'só fora'
      for (const janela of JANELAS) {
        const janLabel = janela === 'season' ? 'temporada' : `últimos ${janela.slice(1)}`
        const prefixo = escopo === 'all' ? `${lado}.${janela}` : `${lado}.venue.${janela}`
        for (const s of STATS_TIME) {
          out.push(c(`${prefixo}.${s.sufixo}`, `${ladoLabel} — ${s.label} (${escLabel}, ${janLabel})`, s.tipo, 'team', s.fontes, s.descricao ?? '', { cobertura: s.cobertura, desde: s.desde }))
        }
      }
    }
    for (const s of STATS_TIME_SEM_JANELA) {
      out.push(c(`${lado}.${s.sufixo}`, `${ladoLabel} — ${s.label}`, s.tipo, 'team', s.fontes, s.descricao ?? '', { cobertura: s.cobertura, desde: s.desde }))
    }
  }
  return out
}

// ────────────────────────────────────────────────────────────────────────────
// Bloco LEAGUE (parâmetros até a data)
// ────────────────────────────────────────────────────────────────────────────

const CAMPOS_LEAGUE: Campo[] = [
  c('league.mu_h', 'Média de gols do mandante', 'goals', 'league', CF, 'Temporada até a data; ≥ 20 jogos', { cobertura: COB_GOLS }),
  c('league.mu_a', 'Média de gols do visitante', 'goals', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.var_h', 'Variância de gols do mandante', 'goals', 'league', CF, 'Para Binomial Negativa', { cobertura: COB_GOLS }),
  c('league.var_a', 'Variância de gols do visitante', 'goals', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.pi_h', 'Excesso de zeros mandante', 'prob', 'league', CF, 'Para ZIP', { cobertura: COB_GOLS }),
  c('league.pi_a', 'Excesso de zeros visitante', 'prob', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.rho', 'ρ de Dixon-Coles', 'ratio', 'league', CF, 'Estimado só com jogos anteriores à data (corrige o vazamento do backtest atual)', { cobertura: COB_GOLS }),
  c('league.mu_h_xg', 'Média de xG do mandante', 'xg', 'league', CF, '', { cobertura: COB_XG }),
  c('league.mu_a_xg', 'Média de xG do visitante', 'xg', 'league', CF, '', { cobertura: COB_XG }),
  c('league.n_matches_season', 'Jogos da temporada até a data', 'int', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.avg_goals', 'Média de gols por jogo', 'goals', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.home_win_pct', '% vitórias do mandante', 'pct', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.draw_pct', '% empates', 'pct', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.over25_pct', '% over 2.5', 'pct', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.btts_pct', '% ambos marcam', 'pct', 'league', CF, '', { cobertura: COB_GOLS }),
  c('league.avg_overround_pinnacle', 'Margem média Pinnacle 1X2', 'pct', 'league', ['core'], '', { cobertura: { core: 0.6 } }),
  c('league.avg_overround_bet365', 'Margem média bet365 1X2', 'pct', 'league', ['fs', 'core', 'fpt'], '', { cobertura: { core: 0.95, fpt: 0.95 } }),
  c('league.fav_win_pct', '% vitórias do favorito', 'pct', 'league', ['fs', 'core', 'fpt'], '', { cobertura: { core: 0.95, fpt: 0.95 } }),
  c('league.params_src', 'Origem dos parâmetros', 'text', 'league', CF, 'season (temporada corrente, ≥ 20 jogos) | prev_season (fim da temporada anterior) | none'),
]

// ────────────────────────────────────────────────────────────────────────────
// Funções virtuais (calculadas no engine, não armazenadas)
// ────────────────────────────────────────────────────────────────────────────

export interface FuncaoVirtual {
  nome: string
  assinatura: string
  retorno: TipoCampo
  descricao: string
}

export const FUNCOES_VIRTUAIS: FuncaoVirtual[] = [
  { nome: 'implied', assinatura: 'implied(odd)', retorno: 'prob', descricao: '1/odd' },
  { nome: 'novig', assinatura: 'novig(o1, o2[, o3], method?)', retorno: 'prob', descricao: 'Probabilidade sem margem do 1º argumento; method ∈ proportional | power | shin | odds_ratio' },
  { nome: 'fair_odd', assinatura: 'fair_odd(prob)', retorno: 'odd', descricao: '1/prob' },
  { nome: 'ev', assinatura: 'ev(prob, odd)', retorno: 'ratio', descricao: 'prob × odd − 1' },
  { nome: 'edge', assinatura: 'edge(prob, odd)', retorno: 'prob', descricao: 'prob − 1/odd' },
  { nome: 'kelly', assinatura: 'kelly(prob, odd)', retorno: 'pct', descricao: '(prob × odd − 1)/(odd − 1), clamp em 0' },
  { nome: 'model', assinatura: 'model(POISSON|DC|ZIP|NB, MEDIA|FORCAS|XG|MERCADO, janela).p_h|p_d|p_a|p_btts|p_over(L)|p_under(L)|p_ah(L, side)|fair_odd(...)|lambda_h|lambda_a', retorno: 'prob', descricao: 'Matriz 11×11 a partir das médias do time e parâmetros da liga na linha (lib/analytics)' },
  { nome: 'quarter', assinatura: 'quarter(x)', retorno: 'line', descricao: 'Arredonda para múltiplo de 0.25' },
  { nome: 'rank', assinatura: 'rank(expr, scope)', retorno: 'int', descricao: 'Posição de expr entre os jogos do mesmo scope ∈ day | round | league_season, calculada dentro do run' },
  { nome: 'pct_rank', assinatura: 'pct_rank(expr, scope)', retorno: 'pct', descricao: 'Percentil de expr no scope' },
  { nome: 'zscore', assinatura: 'zscore(x, mean, sd)', retorno: 'ratio', descricao: '(x − mean)/sd' },
  { nome: 'ifnull', assinatura: 'ifnull(x, y)', retorno: 'ratio', descricao: 'x se não nulo, senão y' },
  { nome: 'if', assinatura: 'if(cond, a, b)', retorno: 'ratio', descricao: 'Condicional' },
  { nome: 'abs/min/max/log/exp/sqrt/round/clamp', assinatura: 'como em JS', retorno: 'ratio', descricao: 'Aritmética básica' },
]

// ────────────────────────────────────────────────────────────────────────────
// Catálogo final
// ────────────────────────────────────────────────────────────────────────────

let _cache: Campo[] | null = null

export function gerarCatalogo(): Campo[] {
  if (_cache) return _cache
  const todos = [...CAMPOS_MATCH, ...gerarOdds(), ...gerarDerivados(), ...gerarTime(), ...CAMPOS_LEAGUE]
  const vistos = new Set<string>()
  for (const f of todos) {
    if (vistos.has(f.key)) throw new Error(`Campo duplicado no catálogo: ${f.key}`)
    vistos.add(f.key)
  }
  _cache = todos
  return todos
}

export const CATALOGO_VERSAO = '1.1.1' // 1.1.0: só bet365 e Pinnacle ativas (D11) · 1.1.1: league.params_src

export function resumoCatalogo() {
  const campos = gerarCatalogo()
  const porBloco: Record<string, number> = {}
  const porTipo: Record<string, number> = {}
  const porFonte: Record<string, number> = { core: 0, fpt: 0, fs: 0 }
  for (const f of campos) {
    porBloco[f.bloco] = (porBloco[f.bloco] ?? 0) + 1
    porTipo[f.tipo] = (porTipo[f.tipo] ?? 0) + 1
    for (const s of f.fontes) porFonte[s]++
  }
  return { versao: CATALOGO_VERSAO, total: campos.length, porBloco, porTipo, porFonte, funcoesVirtuais: FUNCOES_VIRTUAIS.length, casasAtivas: [...CASAS_ATIVAS], casasInativas: [...CASAS_INATIVAS] }
}

export function campoPorChave(key: string): Campo | undefined {
  return gerarCatalogo().find((f) => f.key === key)
}
