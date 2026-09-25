/**
 * Dataset sintético determinístico para os testes do engine: N jogos em 2 competições × 2
 * temporadas, com odds bet365/Pinnacle (abertura e fechamento), estatísticas de janela,
 * parâmetros de liga e placares sorteados de um Poisson coerente com as odds.
 */
import type { Dataset } from '@/lib/laboratorio/engine/tipos'
import { rng, poissonPmf } from '@/lib/laboratorio/engine/matematica'

export interface OpcoesSintetico { n?: number; seed?: number; semPinnacle?: boolean }

function amostraPoisson(lambda: number, r: () => number): number {
  const u = r()
  let acc = 0
  for (let k = 0; k < 15; k++) { acc += poissonPmf(lambda, k); if (u < acc) return k }
  return 15
}

export function datasetSintetico(op: OpcoesSintetico = {}): Dataset {
  const n = op.n ?? 400
  const r = rng(op.seed ?? 7)
  const num = new Map<string, Float64Array>()
  const txt = new Map<string, (string | null)[]>()
  const N = (k: string) => { let c = num.get(k); if (!c) { c = new Float64Array(n).fill(NaN); num.set(k, c) } return c }
  const T = (k: string) => { let c = txt.get(k); if (!c) { c = new Array<string | null>(n).fill(null); txt.set(k, c) } return c }

  const comps = ['comp-a', 'comp-b']
  const times = Array.from({ length: 12 }, (_, i) => `t${i + 1}`)
  const inicio = Date.UTC(2024, 7, 10)
  for (let i = 0; i < n; i++) {
    const comp = comps[i % 2]
    const temporada = i < n / 2 ? '2024' : '2025'
    const data = inicio + Math.floor(i / 4) * 86400000 * 2 + (i < n / 2 ? 0 : 200 * 86400000)
    const h = times[Math.floor(r() * 12)]
    let a = times[Math.floor(r() * 12)]
    if (a === h) a = times[(times.indexOf(h) + 1) % 12]
    T('match.id')[i] = `m${i}`
    T('match.competition')[i] = comp
    T('match.season')[i] = `${comp}-${temporada}`
    T('match.season_label')[i] = temporada
    T('match.competition_type')[i] = 'LEAGUE'
    T('match.country')[i] = 'X'
    T('match.home')[i] = h
    T('match.away')[i] = a
    N('match.utc_date')[i] = data
    N('match.round')[i] = 1 + Math.floor((i % (n / 2)) / 6)
    N('match.competition_level')[i] = 1
    N('match.src_core')[i] = i % 5 === 4 ? 0 : 1
    N('match.src_fpt')[i] = 1
    N('match.src_fs')[i] = 0

    // "verdade" do jogo
    const lh = 0.9 + r() * 1.2, la = 0.7 + r() * 1.0
    N('home.l10.gf')[i] = lh + (r() - 0.5) * 0.4
    N('home.l10.ga')[i] = la + (r() - 0.5) * 0.4
    N('away.l10.gf')[i] = la + (r() - 0.5) * 0.4
    N('away.l10.ga')[i] = lh + (r() - 0.5) * 0.4
    N('home.l5.pts_pg')[i] = Math.min(3, Math.max(0, 1.4 + (lh - la) + (r() - 0.5)))
    N('away.l5.pts_pg')[i] = Math.min(3, Math.max(0, 1.4 - (lh - la) + (r() - 0.5)))
    N('home.venue.l10.xg_for')[i] = lh * (0.9 + r() * 0.2)
    N('away.venue.l10.xg_against')[i] = lh * (0.9 + r() * 0.2)
    N('home.l10.xg_for')[i] = lh; N('home.l10.xg_against')[i] = la; N('away.l10.xg_for')[i] = la; N('away.l10.xg_against')[i] = lh
    N('home.l10.n_used')[i] = 10; N('away.l10.n_used')[i] = 10
    N('home.extra.elo')[i] = 1500 + (lh - la) * 100
    N('league.mu_h')[i] = 1.45; N('league.mu_a')[i] = 1.15; N('league.rho')[i] = -0.08
    N('league.pi_h')[i] = 0.03; N('league.pi_a')[i] = 0.04; N('league.var_h')[i] = 1.7; N('league.var_a')[i] = 1.35
    N('league.mu_h_xg')[i] = 1.4; N('league.mu_a_xg')[i] = 1.1

    // probabilidades justas via Poisson
    let ph = 0, pd = 0, pa = 0, pover = 0, pbtts = 0
    for (let x = 0; x < 10; x++) for (let y = 0; y < 10; y++) {
      const p = poissonPmf(lh, x) * poissonPmf(la, y)
      if (x > y) ph += p; else if (x === y) pd += p; else pa += p
      if (x + y > 2.5) pover += p
      if (x > 0 && y > 0) pbtts += p
    }
    const s = ph + pd + pa; ph /= s; pd /= s; pa /= s
    const margem = 1.05, margemP = 1.025
    const odd = (p: number, m: number, ruido = 0) => Math.round((1 / (p * m)) * (1 + ruido) * 100) / 100
    for (const snap of ['open', 'close'] as const) {
      const ru = snap === 'open' ? (r() - 0.5) * 0.08 : 0
      const b = `odds.bet365.${snap}`
      N(`${b}.1x2.h`)[i] = odd(ph, margem, ru); N(`${b}.1x2.d`)[i] = odd(pd, margem, -ru / 2); N(`${b}.1x2.a`)[i] = odd(pa, margem, -ru / 2)
      N(`${b}.btts.yes`)[i] = odd(pbtts, margem, ru); N(`${b}.btts.no`)[i] = odd(1 - pbtts, margem, -ru)
      N(`${b}.ou.main_line`)[i] = 2.5; N(`${b}.ou.over_main`)[i] = odd(pover, margem, ru); N(`${b}.ou.under_main`)[i] = odd(1 - pover, margem, -ru)
      N(`${b}.ou.over_2_5`)[i] = N(`${b}.ou.over_main`)[i]; N(`${b}.ou.under_2_5`)[i] = N(`${b}.ou.under_main`)[i]
      N(`${b}.ah.main_line`)[i] = -0.5; N(`${b}.ah.home_main`)[i] = odd(ph, margem, ru); N(`${b}.ah.away_main`)[i] = odd(1 - ph, margem, -ru)
      if (snap === 'close') { N(`${b}.dc.1x`)[i] = odd(ph + pd, margem); N(`${b}.dc.x2`)[i] = odd(pd + pa, margem); N(`${b}.dc.12`)[i] = odd(ph + pa, margem) }
      if (!op.semPinnacle && i % 7 !== 6) {
        const p = `odds.pinnacle.${snap}`
        N(`${p}.1x2.h`)[i] = odd(ph, margemP, ru); N(`${p}.1x2.d`)[i] = odd(pd, margemP, -ru / 2); N(`${p}.1x2.a`)[i] = odd(pa, margemP, -ru / 2)
        const sp = 1 / N(`${p}.1x2.h`)[i] + 1 / N(`${p}.1x2.d`)[i] + 1 / N(`${p}.1x2.a`)[i]
        N(`${p}.1x2.novig_h`)[i] = 1 / N(`${p}.1x2.h`)[i] / sp; N(`${p}.1x2.novig_d`)[i] = 1 / N(`${p}.1x2.d`)[i] / sp; N(`${p}.1x2.novig_a`)[i] = 1 / N(`${p}.1x2.a`)[i] / sp
        N(`${p}.ou.main_line`)[i] = 2.5; N(`${p}.ou.over_main`)[i] = odd(pover, margemP, ru); N(`${p}.ou.under_main`)[i] = odd(1 - pover, margemP, -ru)
        N(`${p}.ou.over_2_5`)[i] = N(`${p}.ou.over_main`)[i]; N(`${p}.ou.under_2_5`)[i] = N(`${p}.ou.under_main`)[i]
        N(`${p}.ou.novig_over_main`)[i] = (1 / N(`${p}.ou.over_main`)[i]) / (1 / N(`${p}.ou.over_main`)[i] + 1 / N(`${p}.ou.under_main`)[i])
        N(`${p}.ah.main_line`)[i] = -0.5; N(`${p}.ah.home_main`)[i] = odd(ph, margemP, ru); N(`${p}.ah.away_main`)[i] = odd(1 - ph, margemP, -ru)
        N(`${p}.btts.yes`)[i] = odd(pbtts, margemP, ru); N(`${p}.btts.no`)[i] = odd(1 - pbtts, margemP, -ru)
      }
    }
    T('derived.pinnacle.fav_side')[i] = ph > pa ? 'home' : 'away'
    N('derived.pinnacle.market_lambda_h')[i] = lh; N('derived.pinnacle.market_lambda_a')[i] = la

    // placar
    const gh = amostraPoisson(lh, r), ga = amostraPoisson(la, r)
    N('match.ft_h')[i] = gh; N('match.ft_a')[i] = ga
    N('match.ht_h')[i] = Math.min(gh, amostraPoisson(lh * 0.45, r)); N('match.ht_a')[i] = Math.min(ga, amostraPoisson(la * 0.45, r))
    N('match.corners_h')[i] = 3 + amostraPoisson(2.5, r); N('match.corners_a')[i] = 3 + amostraPoisson(2, r)
  }
  // alguns placares ausentes (jogo sem resultado → VOID)
  N('match.ft_h')[3] = NaN; N('match.ft_a')[3] = NaN
  return { n, numericas: num, textos: txt, versao: 'sintetico-1', catalogoVersao: 'teste' }
}
