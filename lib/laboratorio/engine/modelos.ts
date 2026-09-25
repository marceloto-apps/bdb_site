/**
 * `model(MODELO, LAMBDA, JANELA).saida(...)`: matriz de placares por linha, calculada sob demanda
 * a partir das médias do time e dos parâmetros da liga presentes na linha (§4.2 do plano).
 *
 * λ segue `lib/ferramentas/backtest/projections.ts` (backtest atual) para manter comparabilidade:
 *   MEDIA:  λH = (gf_home + ga_away)/2 · λA = (gf_away + ga_home)/2
 *   FORCAS: λH = (gf_home/μH)·(ga_away/μH)·μH · λA = (gf_away/μA)·(ga_home/μA)·μA
 *   XG:     idem com xg_for/xg_against e μ_xg
 *   MERCADO: derived.<casa>.market_lambda_h/a (Pinnacle, fallback bet365)
 * λ é limitado a [0.01, 10].
 */
import { SELECAO_POR_CODIGO, type No } from './ast'
import type { Avaliador, ContextoCompilacao } from './compile'
import { colunaNumerica, compilar } from './compile'
import * as M from './matematica'

type NoModelo = Extract<No, { t: 'model' }>

interface Lambdas { lh: Avaliador; la: Avaliador }

function lambdas(no: NoModelo, ctx: ContextoCompilacao): Lambdas {
  const w = no.janela
  const col = (k: string) => { const c = colunaNumerica(ctx, k); return c.length ? (i: number) => c[i] : () => NaN }
  const clamp = (v: number) => (Number.isNaN(v) ? NaN : Math.max(0.01, Math.min(v, 10)))
  switch (no.lambda) {
    case 'MEDIA': {
      const hgf = col(`home.${w}.gf`), hga = col(`home.${w}.ga`), agf = col(`away.${w}.gf`), aga = col(`away.${w}.ga`)
      return { lh: (i) => clamp((hgf(i) + aga(i)) / 2), la: (i) => clamp((agf(i) + hga(i)) / 2) }
    }
    case 'FORCAS': {
      const hgf = col(`home.${w}.gf`), hga = col(`home.${w}.ga`), agf = col(`away.${w}.gf`), aga = col(`away.${w}.ga`)
      const muH = col('league.mu_h'), muA = col('league.mu_a')
      return {
        lh: (i) => { const m = muH(i); return clamp(m > 0 ? (hgf(i) / m) * (aga(i) / m) * m : NaN) },
        la: (i) => { const m = muA(i); return clamp(m > 0 ? (agf(i) / m) * (hga(i) / m) * m : NaN) },
      }
    }
    case 'XG': {
      const hxf = col(`home.${w}.xg_for`), hxa = col(`home.${w}.xg_against`), axf = col(`away.${w}.xg_for`), axa = col(`away.${w}.xg_against`)
      const muH = col('league.mu_h_xg'), muA = col('league.mu_a_xg')
      return {
        lh: (i) => { const m = muH(i); return clamp(m > 0 ? (hxf(i) / m) * (axa(i) / m) * m : NaN) },
        la: (i) => { const m = muA(i); return clamp(m > 0 ? (axf(i) / m) * (hxa(i) / m) * m : NaN) },
      }
    }
    case 'MERCADO': {
      const ph = col('derived.pinnacle.market_lambda_h'), pa = col('derived.pinnacle.market_lambda_a')
      const bh = col('derived.bet365.market_lambda_h'), ba = col('derived.bet365.market_lambda_a')
      return {
        lh: (i) => { const v = ph(i); return clamp(Number.isNaN(v) ? bh(i) : v) },
        la: (i) => { const v = pa(i); return clamp(Number.isNaN(v) ? ba(i) : v) },
      }
    }
  }
}

/** Matriz da linha `i`, com cache de uma entrada (as saídas do mesmo modelo são pedidas em sequência). */
function matrizPorLinha(no: NoModelo, ctx: ContextoCompilacao): { lambdas: Lambdas; matriz: (i: number) => M.Matriz | null } {
  const l = lambdas(no, ctx)
  const col = (k: string) => { const c = colunaNumerica(ctx, k); return c.length ? (i: number) => c[i] : () => NaN }
  const rho = no.modelo === 'DC' ? col('league.rho') : () => NaN
  const piH = no.modelo === 'ZIP' ? col('league.pi_h') : () => NaN
  const piA = no.modelo === 'ZIP' ? col('league.pi_a') : () => NaN
  const varH = no.modelo === 'NB' ? col('league.var_h') : () => NaN
  const varA = no.modelo === 'NB' ? col('league.var_a') : () => NaN
  let ultimoI = -1
  let ultima: M.Matriz | null = null
  return {
    lambdas: l,
    matriz: (i) => {
      if (i === ultimoI) return ultima
      ultimoI = i
      const lh = l.lh(i), la = l.la(i)
      if (Number.isNaN(lh) || Number.isNaN(la)) { ultima = null; return null }
      ultima = M.matrizPlacares(no.modelo, lh, la, { rho: rho(i), piH: piH(i), piA: piA(i), varH: varH(i), varA: varA(i) })
      return ultima
    },
  }
}

export function saidaModelo(no: NoModelo, ctx: ContextoCompilacao): Avaliador {
  const { lambdas: l, matriz } = matrizPorLinha(no, ctx)
  const args = no.args.map((a) => compilar(a, ctx))
  switch (no.saida) {
    case 'lambda_h': return l.lh
    case 'lambda_a': return l.la
    case 'p_h': return (i) => { const m = matriz(i); return m ? M.prob1x2(m).h : NaN }
    case 'p_d': return (i) => { const m = matriz(i); return m ? M.prob1x2(m).d : NaN }
    case 'p_a': return (i) => { const m = matriz(i); return m ? M.prob1x2(m).a : NaN }
    case 'p_btts': return (i) => { const m = matriz(i); return m ? M.probBtts(m) : NaN }
    case 'p_over': return (i) => { const m = matriz(i); const L = args[0](i); return m && !Number.isNaN(L) ? M.probEfetiva(M.probLinhaTotal(m, L, 'over')) : NaN }
    case 'p_under': return (i) => { const m = matriz(i); const L = args[0](i); return m && !Number.isNaN(L) ? M.probEfetiva(M.probLinhaTotal(m, L, 'under')) : NaN }
    case 'p_ah': return (i) => {
      const m = matriz(i); const L = args[0](i); const lado = SELECAO_POR_CODIGO[args[1](i)]
      if (!m || Number.isNaN(L) || (lado !== 'home' && lado !== 'away')) return NaN
      return M.probEfetiva(M.probLinhaAh(m, L, lado))
    }
    case 'p_cs': return (i) => { const m = matriz(i); const h = args[0](i), a = args[1](i); return m && !Number.isNaN(h) && !Number.isNaN(a) ? M.probPlacar(m, Math.round(h), Math.round(a)) : NaN }
  }
}
