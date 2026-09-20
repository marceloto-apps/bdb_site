import {
  construirAmostraTime,
  faixasDisponiveis,
  oddReferencia,
  oddNaFaixa,
  type JogoAmostra,
} from '../../lib/analytics/amostra'

const FLA = 'fla'
const RBB = 'rbb'

function jogo(
  id: string,
  homeTeamId: string,
  awayTeamId: string,
  opts: { round?: number | null; mes?: number; oddHome?: number | null; oddAway?: number | null } = {}
): JogoAmostra {
  const { round = 1, mes = 5, oddHome = 1.5, oddAway = 4.0 } = opts
  const odds: JogoAmostra['odds'] = []
  if (oddHome != null) odds.push({ selection: 'home', odds: oddHome, oddsType: 'PREMATCH_CLOSING', market: { key: 'match_odds' } })
  if (oddAway != null) odds.push({ selection: 'away', odds: oddAway, oddsType: 'PREMATCH_CLOSING', market: { key: 'match_odds' } })
  return { id, homeTeamId, awayTeamId, round, utcDate: new Date(Date.UTC(2026, mes - 1, 15, 12)), odds }
}

describe('Amostra sob Filtros Avançados', () => {
  describe('oddReferencia', () => {
    it('prefere fechamento, cai para abertura e ignora outros mercados', () => {
      const j: JogoAmostra = {
        ...jogo('1', FLA, RBB, { oddHome: null, oddAway: null }),
        odds: [
          { selection: 'home', odds: 9.99, oddsType: 'PREMATCH_CLOSING', market: { key: 'asian_handicap' } },
          { selection: 'home', odds: 1.6, oddsType: 'PREMATCH_OPENING', market: { key: 'match_odds' } },
          { selection: 'home', odds: 1.5, oddsType: 'PREMATCH_CLOSING', market: { key: 'match_odds' } },
          { selection: 'away', odds: 5.0, oddsType: 'PREMATCH_OPENING', market: { key: 'match_odds' } },
        ],
      }
      expect(oddReferencia(j, 'home')).toBe(1.5)
      expect(oddReferencia(j, 'away')).toBe(5.0)
    })

    it('retorna null sem odd 1x2', () => {
      expect(oddReferencia(jogo('1', FLA, RBB, { oddHome: null }), 'home')).toBeNull()
    })
  })

  it('oddNaFaixa não deixa buraco entre faixas de 2 casas', () => {
    const faixas = [{ min: 1.21, max: 1.4 }, { min: 1.41, max: 1.7 }]
    expect(oddNaFaixa(1.404, faixas)).toBe(true)
    expect(oddNaFaixa(1.405, faixas)).toBe(true)
    expect(oddNaFaixa(1.71, faixas)).toBe(false)
  })

  describe('construirAmostraTime — CASA_VISITANTE', () => {
    const jogos = [
      jogo('h1', FLA, 'x', { oddHome: 1.3 }),
      jogo('h2', FLA, 'x', { oddHome: 1.5 }),
      jogo('h3', FLA, 'x', { oddHome: 1.9 }),   // fora da faixa
      jogo('h4', FLA, 'x', { oddHome: null }),  // sem odd
      jogo('a1', 'x', FLA, { oddAway: 2.0 }),   // outro mando: não é filtrado
      jogo('z1', 'x', 'y'),                     // jogo de terceiros
    ]

    it('sem filtro usa todos os jogos do mando do confronto', () => {
      const { jogos: usados, jogosOutroMando, resumo } = construirAmostraTime(jogos, FLA, 'home', {})
      expect(usados.map(j => j.id)).toEqual(['h1', 'h2', 'h3', 'h4'])
      expect(jogosOutroMando.map(j => j.id)).toEqual(['a1'])
      expect(resumo).toMatchObject({ total: 4, usados: 4, foraFaixaOdds: 0, semOdd: 0, foraPeriodo: 0 })
    })

    it('filtro de odds corta fora da faixa e sem odd, e conta cada motivo', () => {
      const { resumo, jogosOutroMando } = construirAmostraTime(jogos, FLA, 'home', {
        oddsCasaFaixas: '1.21-1.40,1.41-1.70',
        oddsVisFaixas: '2.71-3.50',
      })
      expect(resumo.matchIds).toEqual(['h1', 'h2'])
      expect(resumo).toMatchObject({ total: 4, usados: 2, foraFaixaOdds: 1, semOdd: 1 })
      // "Odds Visitante" não derruba os jogos fora do mandante
      expect(jogosOutroMando.map(j => j.id)).toEqual(['a1'])
    })

    it('visitante é cortado pela própria odd como visitante', () => {
      const js = [
        jogo('v1', 'x', RBB, { oddAway: 3.0 }),
        jogo('v2', 'x', RBB, { oddAway: 2.5 }),
        jogo('c1', RBB, 'x', { oddHome: 2.0 }),
      ]
      const { resumo } = construirAmostraTime(js, RBB, 'away', { oddsCasaFaixas: '1.21-1.40', oddsVisFaixas: '2.71-3.50' })
      expect(resumo.matchIds).toEqual(['v1'])
      expect(resumo.total).toBe(2)
    })

    it('filtra por rodada e mês', () => {
      const js = [
        jogo('r1', FLA, 'x', { round: 2, mes: 4 }),
        jogo('r2', FLA, 'x', { round: 10, mes: 6 }),
        jogo('r3', FLA, 'x', { round: 20, mes: 6 }),
      ]
      const { resumo } = construirAmostraTime(js, FLA, 'home', { roundFrom: 5, months: '6' })
      expect(resumo.matchIds).toEqual(['r2', 'r3'])
      expect(resumo.foraPeriodo).toBe(1)
    })
  })

  it('GERAL usa os dois mandos, cada um cortado pela faixa do seu mando', () => {
    const jogos = [
      jogo('h1', FLA, 'x', { oddHome: 1.3 }),
      jogo('h2', FLA, 'x', { oddHome: 2.5 }),
      jogo('a1', 'x', FLA, { oddAway: 3.0 }),
      jogo('a2', 'x', FLA, { oddAway: 1.8 }),
    ]
    const { resumo, jogosOutroMando } = construirAmostraTime(
      jogos, FLA, 'home',
      { oddsCasaFaixas: '1.21-1.40', oddsVisFaixas: '2.71-3.50' },
      'GERAL'
    )
    expect(resumo.matchIds).toEqual(['h1', 'a1'])
    expect(resumo.total).toBe(4)
    expect(jogosOutroMando).toEqual([])
  })

  it('faixasDisponiveis olha só o mando do confronto', () => {
    const jogos = [jogo('h1', FLA, 'x', { oddHome: 1.3 }), jogo('a1', 'x', FLA, { oddAway: 1.5 })]
    const faixas = [{ min: 1.21, max: 1.4 }, { min: 1.41, max: 1.7 }]
    expect(faixasDisponiveis(jogos, FLA, 'home', faixas)).toEqual([true, false])
    expect(faixasDisponiveis(jogos, FLA, 'away', faixas)).toEqual([false, true])
  })
})
