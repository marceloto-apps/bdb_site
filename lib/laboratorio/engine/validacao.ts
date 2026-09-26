/**
 * Validação avançada (Fase 5, §6.4, §6.6 e §6.7 do plano): holdout selado, folds temporais,
 * walk-forward (com escolha de parâmetros por janela quando há varredura), varredura de `$p` com
 * PBO-lite, deflação por tentativas, Monte Carlo sobre as apostas (com o staking escolhido),
 * seleção aleatória nos mesmos jogos (distribuição nula) e calibração de probabilidades.
 *
 * Puro e determinístico (semente da estratégia). Recebe o resultado do run principal e uma função
 * `rodar` para as execuções auxiliares (varredura), evitando import circular com run.ts.
 */
import { compilar, type ContextoCompilacao } from './compile'
import { resolvedorEntrada } from './entradas'
import type { EstrategiaCompilada } from './estrategia'
import { liquidar, type Placar } from './liquidacao'
import * as M from './matematica'
import { calcularInferencia, calcularKpis } from './metricas'
import { dependeDoBanco, unidadeFlat } from './staking'
import type { Aposta, ComboVarredura, Dataset, JanelaWalkForward, ResumoFold, RunResult, ValidacaoResult } from './tipos'
import type { OpcoesRun } from './run'

export interface HoldoutInfo {
  /** competição → chave da última temporada */
  temporadas: Map<string, string>
  /** jogos deixados de fora quando selado (contados no manifesto); null quando desconhecido */
  jogosOcultos: number | null
}

export interface ContextoValidacao {
  mascaraUniverso: Uint8Array
  ctx: ContextoCompilacao
  op: OpcoesRun
  rodar: (ec: EstrategiaCompilada, ds: Dataset, op: OpcoesRun) => RunResult
}

export const LIMITE_COMBOS = 200
const r4 = (x: number) => (Number.isFinite(x) ? Math.round(x * 1e4) / 1e4 : x)
const ativas = (apostas: Aposta[]) => apostas.filter((a) => a.resultado !== 'VOID' && a.stake > 0)

export function validarAvancado(ec: EstrategiaCompilada, dataset: Dataset, run: RunResult, cv: ContextoValidacao): ValidacaoResult {
  const t0 = Date.now()
  const e = ec.estrategia
  const va = e.validacao ?? {}
  const seed = e.seed ?? 42
  const uFlat = unidadeFlat(e)
  const apostas = ativas(run.apostas)
  const progresso = (feitos: number, total: number) => cv.op.aoProgresso?.('validando', feitos, total)
  progresso(0, 6)

  const resumo = (chave: string, xs: Aposta[]): ResumoFold => {
    const k = calcularKpis(xs, 0, uFlat)
    const inf = calcularInferencia(xs, k, 0, seed)
    let clv = 0, nClv = 0, de = Infinity, ate = -Infinity
    for (const a of xs) { if (!Number.isNaN(a.clvNovig)) { clv += a.clvNovig; nClv++ } if (a.data < de) de = a.data; if (a.data > ate) ate = a.data }
    return { chave, de: Number.isFinite(de) ? de : NaN, ate: Number.isFinite(ate) ? ate : NaN, n: k.n, turnover: k.turnover, lucro: k.lucro, yield: k.yield, hitRate: k.hitRate, clvNovigMedio: r4(nClv ? clv / nClv : NaN), tYield: inf.tYield, pValor: inf.pValor }
  }

  // ── holdout ──
  const modo = va.holdout ?? 'nenhum'
  const hold = cv.op.holdout
  let holdout: ValidacaoResult['holdout'] = { modo, temporadas: hold?.temporadas.size ?? 0, jogosOcultos: modo === 'selado' ? (hold?.jogosOcultos ?? null) : null, anteriores: null, holdout: null }
  if (modo === 'aberto' && hold) {
    const comp = dataset.textos.get('match.competition'), season = dataset.textos.get('match.season')
    const ehHoldout = (a: Aposta) => !!comp && !!season && hold.temporadas.get(comp[a.i] ?? '') === (season[a.i] ?? '')
    const dentro = apostas.filter(ehHoldout), fora = apostas.filter((a) => !ehHoldout(a))
    holdout = { ...holdout, anteriores: resumo('anteriores', fora), holdout: resumo('holdout', dentro) }
  }
  progresso(1, 6)

  // ── folds ──
  const tipoFold = va.folds ?? 'temporada'
  const grupos = new Map<string, Aposta[]>()
  for (const a of apostas) {
    const chave = tipoFold === 'ano' ? String(new Date(a.data).getUTCFullYear()) : a.temporada || '?'
    let g = grupos.get(chave); if (!g) { g = []; grupos.set(chave, g) } g.push(a)
  }
  const itens = Array.from(grupos.entries()).map(([k, xs]) => resumo(k, xs)).sort((a, b) => a.de - b.de)
  const folds = { tipo: tipoFold, itens, positivos: itens.filter((f) => f.lucro > 0).length, total: itens.length }
  progresso(2, 6)

  // ── janelas de tempo: fixadas antes do resultado, por quantis das datas do universo (robusto a
  //    intervalos sem jogos, como o período entre temporadas) ──
  const cData = dataset.numericas.get('match.utc_date')
  const datasUni: number[] = []
  if (cData) for (let i = 0; i < dataset.n; i++) if (cv.mascaraUniverso[i] && !Number.isNaN(cData[i])) datasUni.push(cData[i])
  datasUni.sort((x, y) => x - y)
  const tMin = datasUni[0] ?? NaN, tMax = datasUni[datasUni.length - 1] ?? NaN
  const temTempo = datasUni.length >= 20 && tMax > tMin
  /** k+1 limites: o primeiro é tMin, o último tMax+1 (exclusivo); os internos são quantis */
  const limites = (k: number): number[] => { const out: number[] = [tMin]; for (let j = 1; j < k; j++) out.push(datasUni[Math.floor((datasUni.length * j) / k)]); out.push(tMax + 1); return out }
  const periodoDe = (lim: number[]) => (t: number) => { let p = 0; while (p < lim.length - 2 && t >= lim[p + 1]) p++; return p }

  // ── varredura ──
  const nomesVar = Object.keys(va.varredura ?? {}).filter((k) => k in (e.parametros ?? {}))
  let combosDef: Record<string, number>[] = []
  let truncada = false
  if (nomesVar.length) {
    combosDef = [{}]
    for (const nome of nomesVar) {
      const f = (va.varredura as NonNullable<typeof va.varredura>)[nome]
      const valores: number[] = []
      for (let v = f.de; v <= f.ate + 1e-12 && valores.length <= LIMITE_COMBOS; v += f.passo) valores.push(Math.round(v * 1e6) / 1e6)
      combosDef = combosDef.flatMap((c) => valores.map((v) => ({ ...c, [nome]: v })))
      if (combosDef.length > LIMITE_COMBOS) { combosDef = combosDef.slice(0, LIMITE_COMBOS); truncada = true }
    }
  }
  const apostasCombo: Aposta[][] = []
  const combos: ComboVarredura[] = []
  for (let c = 0; c < combosDef.length; c++) {
    const parametros = { ...(e.parametros ?? {}), ...combosDef[c] }
    const r = cv.rodar({ ...ec, estrategia: { ...e, parametros, bootstrap: 0, validacao: undefined } }, dataset, { ...cv.op, validacao: false, extras: false, bootstrap: 0, maxApostas: undefined, aoProgresso: undefined })
    const xs = ativas(r.apostas)
    apostasCombo.push(xs)
    const res = resumo(`c${c}`, xs)
    combos.push({ parametros: combosDef[c], n: res.n, turnover: res.turnover, lucro: res.lucro, yield: res.yield, hitRate: res.hitRate, clvNovigMedio: res.clvNovigMedio, pValor: res.pValor, mdd: r.caminho.mdd })
    if (c % 10 === 9) cv.op.aoProgresso?.('varrendo', c + 1, combosDef.length)
  }
  let varredura: ValidacaoResult['varredura'] = null
  if (combos.length) {
    const elegiveis = combos.filter((c) => c.n >= 30)
    const melhor = (elegiveis.length ? elegiveis : combos).reduce((m, c) => (Number.isFinite(c.yield) && (!Number.isFinite(m.yield) || c.yield > m.yield) ? c : m))
    // PBO-lite: 4 períodos, C(4,2) = 6 divisões treino/teste; a melhor no treino fica abaixo da mediana no teste?
    let pbo = NaN, pboTestes = 0
    if (temTempo && combos.length >= 2) {
      const periodo = periodoDe(limites(4))
      const porPeriodo = apostasCombo.map((xs) => { const l = [0, 0, 0, 0], tv = [0, 0, 0, 0], nn = [0, 0, 0, 0]; for (const a of xs) { const p = periodo(a.data); l[p] += a.pnl; tv[p] += a.stake; nn[p]++ } return { l, tv, nn } })
      const pares: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]
      let abaixo = 0
      for (const [p1, p2] of pares) {
        const yTreino = porPeriodo.map((x) => { const t = x.tv[p1] + x.tv[p2]; return { y: t > 0 ? (x.l[p1] + x.l[p2]) / t : NaN, n: x.nn[p1] + x.nn[p2] } })
        const yTeste = porPeriodo.map((x) => { let t = 0, l = 0; for (let p = 0; p < 4; p++) if (p !== p1 && p !== p2) { t += x.tv[p]; l += x.l[p] } return t > 0 ? l / t : NaN })
        let best = -1
        for (let c = 0; c < combos.length; c++) if (yTreino[c].n >= 20 && Number.isFinite(yTreino[c].y) && (best < 0 || yTreino[c].y > yTreino[best].y)) best = c
        if (best < 0 || !Number.isFinite(yTeste[best])) continue
        const validos = yTeste.filter((y) => Number.isFinite(y))
        if (validos.length < 2) continue
        const acima = validos.filter((y) => y > yTeste[best]).length
        pboTestes++
        if (acima / validos.length >= 0.5) abaixo++
      }
      pbo = pboTestes ? abaixo / pboTestes : NaN
    }
    let heatmap: NonNullable<ValidacaoResult['varredura']>['heatmap'] = null
    if (nomesVar.length === 2) {
      const [px, py] = nomesVar
      const x = Array.from(new Set(combosDef.map((c) => c[px]))).sort((a, b) => a - b)
      const y = Array.from(new Set(combosDef.map((c) => c[py]))).sort((a, b) => a - b)
      const yi: (number | null)[][] = y.map(() => x.map(() => null)), ni: number[][] = y.map(() => x.map(() => 0))
      combos.forEach((c) => { const ix = x.indexOf(c.parametros[px]), iy = y.indexOf(c.parametros[py]); if (ix >= 0 && iy >= 0) { yi[iy][ix] = Number.isFinite(c.yield) ? c.yield : null; ni[iy][ix] = c.n } })
      heatmap = { x, y, yield: yi, n: ni }
    }
    varredura = { parametros: nomesVar, combos, melhor, truncada, pbo: r4(pbo), pboTestes, heatmap }
  }
  progresso(3, 6)

  // ── walk-forward ──
  let walkForward: ValidacaoResult['walkForward'] = null
  const wf = va.walkForward
  if (wf && temTempo && wf.janelas >= 2) {
    const K = Math.min(8, wf.janelas), lim = limites(K), expandindo = wf.expandindo !== false
    const otimizado = combos.length > 1
    const janelas: JanelaWalkForward[] = []
    const oos: Aposta[] = []
    let lucroIs = 0, turnoverIs = 0
    const noIntervalo = (xs: Aposta[], de: number, ate: number) => xs.filter((a) => a.data >= de && a.data < ate)
    for (let k = 1; k < K; k++) {
      const deTreino = expandindo ? lim[0] : lim[k - 1], ateTreino = lim[k], deTeste = lim[k], ateTeste = lim[k + 1]
      let escolhido = -1, parametros: Record<string, number> | null = null
      let treino: Aposta[], teste: Aposta[]
      if (otimizado) {
        let melhorY = -Infinity, maiorN = -1, porN = -1
        for (let c = 0; c < combos.length; c++) {
          const tr = noIntervalo(apostasCombo[c], deTreino, ateTreino)
          let l = 0, t = 0; for (const a of tr) { l += a.pnl; t += a.stake }
          if (tr.length > maiorN) { maiorN = tr.length; porN = c }
          if (tr.length >= 20 && t > 0 && l / t > melhorY) { melhorY = l / t; escolhido = c }
        }
        if (escolhido < 0) escolhido = porN
        if (escolhido < 0) continue
        parametros = combosDef[escolhido]
        treino = noIntervalo(apostasCombo[escolhido], deTreino, ateTreino)
        teste = noIntervalo(apostasCombo[escolhido], deTeste, ateTeste)
      } else {
        treino = noIntervalo(apostas, deTreino, ateTreino)
        teste = noIntervalo(apostas, deTeste, ateTeste)
      }
      const rt = resumo('treino', treino), rs = resumo('teste', teste)
      lucroIs += rt.lucro; turnoverIs += rt.turnover
      oos.push(...teste)
      janelas.push({ k, de: deTeste, ate: ateTeste, parametros, nTreino: rt.n, yieldTreino: rt.yield, nTeste: rs.n, yieldTeste: rs.yield, lucroTeste: rs.lucro, clvTeste: rs.clvNovigMedio })
    }
    oos.sort((a, b) => a.data - b.data)
    const ro = resumo('oos', oos)
    const yieldIs = r4(turnoverIs > 0 ? lucroIs / turnoverIs : NaN)
    const cum: number[] = []; let c = 0; for (const a of oos) { c += a.pnl; cum.push(r4(c)) }
    walkForward = { janelas, expandindo, otimizado, nOos: ro.n, yieldOos: ro.yield, lucroOos: ro.lucro, yieldIs, wfe: r4(yieldIs > 0 && Number.isFinite(ro.yield) ? ro.yield / yieldIs : NaN), oosCumulativo: amostrarSerie(cum, 400) }
  }
  progresso(4, 6)

  // ── deflação por tentativas ──
  const tentativasPrevias = Math.max(0, cv.op.tentativasPrevias ?? 0)
  const tentativas = Math.max(1, combos.length) + tentativasPrevias
  const p = run.inferencia.pValor, t = run.inferencia.tYield
  const pDefl = Number.isFinite(p) ? 1 - Math.pow(1 - p, tentativas) : NaN
  const tEsperadoMax = tentativas > 1 ? tEsperadoMaximo(tentativas) : 0
  const deflacao = { tentativas, tentativasPrevias, pValor: r4(p), pValorDeflacionado: r4(pDefl), tYield: r4(t), tDeflacionado: r4(Number.isFinite(t) ? t - tEsperadoMax : NaN), tEsperadoMax: r4(tEsperadoMax), provavelSelecao: Number.isFinite(p) && p < 0.05 && !(pDefl < 0.05) }

  // ── Monte Carlo ──
  let monteCarlo: ValidacaoResult['monteCarlo'] = null
  if (apostas.length >= 10) {
    const caminhos = Math.min(10000, Math.max(100, va.monteCarlo?.caminhos ?? 2000))
    const ruinaPct = va.monteCarlo?.ruinaPct ?? 0.5
    monteCarlo = { ...simularMonteCarlo(apostas, e.bancoInicial ?? 0, dependeDoBanco(e.staking), caminhos, ruinaPct, seed), selecaoAleatoria: selecaoAleatoria(ec, dataset, cv, apostas, run.kpis.yieldFlat, seed) }
  }
  progresso(5, 6)

  // ── calibração ──
  let calibracao: ValidacaoResult['calibracao'] = null
  const probAst = ec.calibracaoProb ?? (e.staking.metodo === 'kelly' ? ec.stakingProb : null)
  if (probAst) {
    const fn = compilar(probAst, cv.ctx)
    calibracao = calibrar(apostas, fn, va.calibracao?.prob.formula ?? (e.staking.metodo === 'kelly' ? e.staking.prob.formula ?? '' : ''))
  }
  progresso(6, 6)

  return { holdout, folds, walkForward, varredura, deflacao, monteCarlo, calibracao, tempoMs: Date.now() - t0 }
}

/** E[max de N normais padrão] (Bailey & López de Prado, 2014). */
export function tEsperadoMaximo(n: number): number {
  if (n <= 1) return 0
  const g = 0.5772156649
  return (1 - g) * M.normalInv(1 - 1 / n) + g * M.normalInv(1 - 1 / (n * Math.E))
}

function amostrarSerie(xs: number[], max: number): number[] {
  if (xs.length <= max) return xs
  const passo = xs.length / max
  const out: number[] = []
  for (let i = 0; i < max; i++) out.push(xs[Math.floor(i * passo)])
  out.push(xs[xs.length - 1])
  return out
}

export function simularMonteCarlo(apostas: Aposta[], bancoInicial: number, porBanco: boolean, caminhos: number, ruinaPct: number, seed: number): Omit<NonNullable<ValidacaoResult['monteCarlo']>, 'selecaoAleatoria'> {
  const n = apostas.length
  const ret = new Float64Array(n), stakeAbs = new Float64Array(n), frac = new Float64Array(n)
  for (let j = 0; j < n; j++) {
    const a = apostas[j]
    ret[j] = a.pnl / a.stake
    stakeAbs[j] = a.stake
    const antes = a.banco - a.pnl
    frac[j] = antes > 0 ? a.stake / antes : 0
  }
  const r = M.rng(seed + 1)
  const finais = new Float64Array(caminhos), mdds = new Float64Array(caminhos), mddsPct = new Float64Array(caminhos)
  let lucros = 0, ruinas = 0
  const amostras: number[][] = []
  const passo = Math.max(1, Math.floor(n / 60))
  for (let s = 0; s < caminhos; s++) {
    let banco = bancoInicial, cum = 0, pico = 0, mdd = 0, picoB = bancoInicial, mddPct = 0, ruiu = false
    const traco: number[] | null = s < 12 ? [0] : null
    for (let t = 0; t < n; t++) {
      const j = Math.floor(r() * n)
      const stake = porBanco ? frac[j] * banco : stakeAbs[j]
      if (!(stake > 0)) { if (porBanco) { ruiu = true; break } continue }
      const pnl = stake * ret[j]
      banco += pnl; cum += pnl
      if (cum > pico) pico = cum
      const dd = pico - cum; if (dd > mdd) mdd = dd
      if (banco > picoB) picoB = banco
      if (bancoInicial > 0) {
        const ddPct = picoB > 0 ? (picoB - banco) / picoB : 1
        if (ddPct > mddPct) mddPct = ddPct
        if (ddPct >= ruinaPct) { ruiu = true; if (traco) traco.push(r4(cum)); break }
      }
      if (traco && (t + 1) % passo === 0) traco.push(r4(cum))
    }
    finais[s] = cum; mdds[s] = mdd; mddsPct[s] = bancoInicial > 0 ? mddPct : NaN
    if (cum > 0) lucros++
    if (ruiu) ruinas++
    if (traco) amostras.push(traco)
  }
  const of = Float64Array.from(finais).sort(), om = Float64Array.from(mdds).sort()
  const op = Float64Array.from(mddsPct).filter((v) => !Number.isNaN(v)).sort()
  const q = (xs: Float64Array, p: number) => r4(xs.length ? M.quantil(xs, p) : NaN)
  const bins = 20, lo = of[0], hi = of[of.length - 1], larg = (hi - lo) / bins || 1
  const histograma = Array.from({ length: bins }, (_, b) => ({ de: r4(lo + b * larg), ate: r4(lo + (b + 1) * larg), n: 0 }))
  for (let s = 0; s < caminhos; s++) histograma[Math.min(bins - 1, Math.floor((finais[s] - lo) / larg))].n++
  return {
    caminhos, ruinaPct, n,
    lucroFinal: { p5: q(of, 0.05), p25: q(of, 0.25), p50: q(of, 0.5), p75: q(of, 0.75), p95: q(of, 0.95) },
    mdd: { p50: q(om, 0.5), p95: q(om, 0.95), p99: q(om, 0.99) },
    mddPct: { p50: q(op, 0.5), p95: q(op, 0.95), p99: q(op, 0.99) },
    probLucro: r4(lucros / caminhos), probRuina: r4(bancoInicial > 0 || porBanco ? ruinas / caminhos : NaN),
    histograma, amostras,
  }
}

/** Distribuição nula (Kaunitz): mesmas entradas em jogos sorteados do universo, stake flat 1. */
function selecaoAleatoria(ec: EstrategiaCompilada, dataset: Dataset, cv: ContextoValidacao, apostas: Aposta[], yieldReal: number, seed: number): NonNullable<ValidacaoResult['monteCarlo']>['selecaoAleatoria'] {
  const linhas: number[] = []
  for (let i = 0; i < dataset.n; i++) if (cv.mascaraUniverso[i]) linhas.push(i)
  if (linhas.length < 20 || !apostas.length || !Number.isFinite(yieldReal)) return null
  const resolvers = new Map(ec.entradas.map((ent) => [ent.id, { ent, resolve: resolvedorEntrada(ent, cv.ctx) }]))
  const num = (k: string) => dataset.numericas.get(k)
  const ftH = num('match.ft_h'), ftA = num('match.ft_a'), htH = num('match.ht_h'), htA = num('match.ht_a'), coH = num('match.corners_h'), coA = num('match.corners_a')
  const r = M.rng(seed + 2)
  const sorteios = 300
  const ys: number[] = []
  for (let s = 0; s < sorteios; s++) {
    let lucro = 0, turnover = 0
    for (const a of apostas) {
      const rv = resolvers.get(a.entradaId); if (!rv) continue
      const i = linhas[Math.floor(r() * linhas.length)]
      const o = rv.resolve(i); if (!o) continue
      const placar: Placar = { ftH: ftH ? ftH[i] : NaN, ftA: ftA ? ftA[i] : NaN, htH: htH?.[i], htA: htA?.[i], cornersH: coH?.[i], cornersA: coA?.[i] }
      const liq = liquidar(rv.ent.entrada.mercado, o.selecao, o.linha, o.oddLiquidacao, 1, placar)
      if (liq.resultado === 'VOID') continue
      lucro += liq.pnl; turnover += 1
    }
    if (turnover > 0) ys.push(lucro / turnover)
  }
  if (ys.length < 10) return null
  const media = M.media(ys), sd = M.desvioPadrao(ys)
  const z = sd > 0 ? (yieldReal - media) / sd : NaN
  return { sorteios: ys.length, yieldReal: r4(yieldReal), yieldMedio: r4(media), desvio: r4(sd), z: r4(z), pValor: r4(Number.isFinite(z) ? 1 - M.normalCdf(z) : NaN) }
}

export function calibrar(apostas: Aposta[], prob: (i: number) => number, formula: string): ValidacaoResult['calibracao'] {
  const ps: number[] = [], ys: number[] = [], qs: number[] = []
  const clamp = (x: number) => Math.min(1 - 1e-6, Math.max(1e-6, x))
  for (const a of apostas) {
    if (a.resultado !== 'WIN' && a.resultado !== 'LOSS') continue
    const p = prob(a.i)
    if (!(p >= 0 && p <= 1) || Number.isNaN(a.qRef)) continue
    ps.push(clamp(p)); ys.push(a.resultado === 'WIN' ? 1 : 0); qs.push(clamp(a.qRef))
  }
  const n = ps.length
  if (n < 10) return { formula, n, brier: NaN, brierRef: NaN, logLoss: NaN, logLossRef: NaN, ece: NaN, skill: NaN, bins: [] }
  let brier = 0, brierRef = 0, ll = 0, llRef = 0
  const bins = Array.from({ length: 10 }, () => ({ somaP: 0, somaY: 0, n: 0 }))
  for (let k = 0; k < n; k++) {
    const p = ps[k], y = ys[k], q = qs[k]
    brier += (p - y) ** 2; brierRef += (q - y) ** 2
    ll -= y ? Math.log(p) : Math.log(1 - p); llRef -= y ? Math.log(q) : Math.log(1 - q)
    const b = Math.min(9, Math.floor(p * 10)); bins[b].somaP += p; bins[b].somaY += y; bins[b].n++
  }
  brier /= n; brierRef /= n; ll /= n; llRef /= n
  let ece = 0
  const saida = bins.filter((b) => b.n > 0).map((b) => { const pm = b.somaP / b.n, f = b.somaY / b.n; ece += (b.n / n) * Math.abs(f - pm); return { pMedio: r4(pm), freq: r4(f), n: b.n } })
  return { formula, n, brier: r4(brier), brierRef: r4(brierRef), logLoss: r4(ll), logLossRef: r4(llRef), ece: r4(ece), skill: r4(brierRef > 0 ? 1 - brier / brierRef : NaN), bins: saida }
}
