/**
 * Entradas (pernas) da estratégia (§5.1 item 4): mapeia mercado × seleção × linha × casa ×
 * snapshot para as colunas de odds do catálogo, resolve seleção/linha por expressão e monta a
 * referência de probabilidade justa (no-vig do fechamento Pinnacle; fallback bet365 "soft") para
 * EV e CLV.
 */
import { CODIGO_SELECAO, SELECAO_POR_CODIGO, type No } from './ast'
import type { Avaliador, ContextoCompilacao } from './compile'
import { colunaNumerica, compilar } from './compile'
import * as M from './matematica'
import type { Casa, Entrada, Mercado, Snapshot } from './tipos'

export const MERCADOS: readonly Mercado[] = ['1x2', 'btts', 'ou', 'ah', 'corners', 'ht_1x2', 'ht_ou', 'ht_ah', 'dc', 'eh', 'cs']

/** Seleções válidas por mercado (nomes usados nas colunas/JSON). */
export const SELECOES_POR_MERCADO: Record<Mercado, readonly string[]> = {
  '1x2': ['home', 'draw', 'away'],
  btts: ['yes', 'no'],
  ou: ['over', 'under'],
  ah: ['home', 'away'],
  corners: ['over', 'under'],
  ht_1x2: ['home', 'draw', 'away'],
  ht_ou: ['over', 'under'],
  ht_ah: ['home', 'away'],
  dc: ['1x', 'x2', '12'],
  eh: ['home', 'draw', 'away'],
  cs: ['0_0', '0_1', '0_2', '0_3', '1_0', '1_1', '1_2', '1_3', '2_0', '2_1', '2_2', '2_3', '3_0', '3_1', '3_2', '3_3', 'other'],
}

/** Linhas fixas com coluna própria (as demais só via `main`). */
const LINHAS_FIXAS: Partial<Record<Mercado, number[]>> = { ou: [0.5, 1.5, 2.5, 3.5, 4.5], ht_ou: [0.5, 1.5, 2.5] }
/** Mercados que exigem linha */
export const COM_LINHA: readonly Mercado[] = ['ou', 'ah', 'corners', 'ht_ou', 'ht_ah', 'eh']

const LETRA: Record<string, string> = { home: 'h', draw: 'd', away: 'a' }
/** Mercados que só a bet365 oferece no catálogo (D11); dc/eh/cs só no fechamento. */
const SO_BET365: readonly Mercado[] = ['ht_1x2', 'ht_ou', 'ht_ah', 'dc', 'eh', 'cs']
const SO_FECHAMENTO: readonly Mercado[] = ['dc', 'eh', 'cs']
export function casaTemMercado(casa: Casa, snapshot: Snapshot, mercado: Mercado): boolean {
  if (SO_BET365.includes(mercado) && casa !== 'bet365') return false
  if (SO_FECHAMENTO.includes(mercado) && snapshot !== 'close') return false
  return true
}
const fmtLinha = (l: number) => String(l).replace('.', '_')

export interface ChavesOdd {
  /** coluna da odd */
  odd: string
  /** coluna da linha principal (quando a odd é "main") */
  linha?: string
  /** linha fixa embutida na coluna */
  linhaFixa?: number
}

/**
 * Coluna(s) de odd para (mercado, casa, snapshot, seleção, linha). `null` quando a combinação não
 * existe no catálogo (ex.: Pinnacle não tem dc/eh/cs; linha 5.5 de O/U só via main).
 */
export function chavesOdd(mercado: Mercado, casa: Casa, snapshot: Snapshot, selecao: string, linha: number | 'main' | null): ChavesOdd | null {
  const base = `odds.${casa}.${snapshot}`
  const sel = selecao.toLowerCase()
  if (!SELECOES_POR_MERCADO[mercado].includes(sel)) return null
  if (!casaTemMercado(casa, snapshot, mercado)) return null
  switch (mercado) {
    case '1x2': return { odd: `${base}.1x2.${LETRA[sel]}` }
    case 'ht_1x2': return { odd: `${base}.ht_1x2.${LETRA[sel]}` }
    case 'btts': return { odd: `${base}.btts.${sel}` }
    case 'dc': return { odd: `${base}.dc.${sel}` }
    case 'cs': return { odd: `${base}.cs.${sel}` }
    case 'eh': {
      if (typeof linha !== 'number' || !Number.isInteger(linha) || linha === 0 || Math.abs(linha) > 3) return null
      return { odd: `${base}.eh.${LETRA[sel]}_${linha < 0 ? 'm' : 'p'}${Math.abs(linha)}`, linhaFixa: linha }
    }
    case 'ou': case 'ht_ou': {
      if (linha === 'main' || linha === null) return { odd: `${base}.${mercado}.${sel}_main`, linha: `${base}.${mercado}.main_line` }
      if (!LINHAS_FIXAS[mercado]?.includes(linha)) return null
      return { odd: `${base}.${mercado}.${sel}_${fmtLinha(linha)}`, linhaFixa: linha }
    }
    case 'corners': return { odd: `${base}.corners.${sel}_main`, linha: `${base}.corners.main_line` }
    case 'ah': case 'ht_ah': return { odd: `${base}.${mercado}.${sel}_main`, linha: `${base}.${mercado}.main_line` }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Resolução por linha
// ────────────────────────────────────────────────────────────────────────────

export interface EntradaCompilada {
  entrada: Entrada
  id: string
  selecaoFixa: string | null
  selecaoAst: No | null
  linhaFixa: number | 'main' | null
  linhaAst: No | null
  condicaoAst: No | null
}

export interface OddResolvida {
  selecao: string
  linha: number | null
  odd: number
  oddLiquidacao: number
}

interface Acesso { odd: Avaliador; linha: Avaliador | null; linhaFixa: number | null }

function acesso(ctx: ContextoCompilacao, ch: ChavesOdd | null): Acesso | null {
  if (!ch) return null
  const c = colunaNumerica(ctx, ch.odd)
  const odd: Avaliador = c.length ? (i) => c[i] : () => NaN
  let linha: Avaliador | null = null
  if (ch.linha) { const l = colunaNumerica(ctx, ch.linha); linha = l.length ? (i) => l[i] : () => NaN }
  return { odd, linha, linhaFixa: ch.linhaFixa ?? null }
}

/**
 * Resolve a odd de decisão e de liquidação da perna na linha `i`. Devolve null quando a seleção
 * não se resolve, a odd não existe, a linha pedida não é a principal da casa, ou os filtros de
 * odd/condição da perna falham.
 */
export function resolvedorEntrada(ec: EntradaCompilada, ctx: ContextoCompilacao): (i: number) => OddResolvida | null {
  const e = ec.entrada
  const casaDec = e.preco.casa, snapDec = e.preco.snapshot
  const casaLiq = e.liquidacao?.casa ?? casaDec, snapLiq = e.liquidacao?.snapshot ?? snapDec
  const mesmoPreco = casaLiq === casaDec && snapLiq === snapDec
  const selecaoFn = ec.selecaoAst ? compilar(ec.selecaoAst, ctx) : null
  const linhaFn = ec.linhaAst ? compilar(ec.linhaAst, ctx) : null
  const condFn = ec.condicaoAst ? compilar(ec.condicaoAst, ctx) : null
  const slippage = e.slippage ?? 0
  const oddMin = e.oddMin ?? 1, oddMax = e.oddMax ?? Infinity

  // acessos por seleção (linha main ou fixa conhecida em tempo de compilação)
  const cache = new Map<string, { dec: Acesso | null; liq: Acesso | null }>()
  const acessos = (sel: string, linha: number | 'main' | null) => {
    const k = `${sel}|${linha}`
    let a = cache.get(k)
    if (!a) {
      a = { dec: acesso(ctx, chavesOdd(e.mercado, casaDec, snapDec, sel, linha)), liq: mesmoPreco ? null : acesso(ctx, chavesOdd(e.mercado, casaLiq, snapLiq, sel, linha)) }
      cache.set(k, a)
    }
    return a
  }
  const precisaLinha = COM_LINHA.includes(e.mercado)

  return (i) => {
    if (condFn) { const c = condFn(i); if (c === 0 || Number.isNaN(c)) return null }
    let sel = ec.selecaoFixa
    if (selecaoFn) { const code = selecaoFn(i); sel = SELECAO_POR_CODIGO[code] ?? null; if (sel?.startsWith('dc_')) sel = sel.slice(3) }
    if (!sel) return null

    // linha pedida
    let pedida: number | 'main' | null = ec.linhaFixa
    if (linhaFn) { const v = linhaFn(i); if (Number.isNaN(v)) return null; pedida = M.quarter(v) }
    if (precisaLinha && pedida === null) pedida = 'main'

    // para ah/corners/ht_ah (só main) uma linha fixa pedida precisa coincidir com a principal
    let chaveLinha: number | 'main' | null = pedida
    if (typeof pedida === 'number' && !(LINHAS_FIXAS[e.mercado]?.includes(pedida)) && e.mercado !== 'eh') chaveLinha = 'main'
    const a = acessos(sel, chaveLinha)
    if (!a.dec) return null
    const oddBruta = a.dec.odd(i)
    if (!(oddBruta > 1)) return null
    let linha: number | null = null
    if (precisaLinha) {
      linha = a.dec.linhaFixa ?? (a.dec.linha ? a.dec.linha(i) : NaN)
      if (Number.isNaN(linha)) return null
      if (typeof pedida === 'number' && Math.abs(pedida - linha) > 1e-9) return null
    }
    const odd = 1 + (oddBruta - 1) * (1 - slippage)
    if (odd < oddMin || odd > oddMax) return null

    let oddLiquidacao = odd
    if (!mesmoPreco) {
      if (!a.liq) return null
      const ol = a.liq.odd(i)
      if (!(ol > 1)) return null
      if (precisaLinha) {
        const ll = a.liq.linhaFixa ?? (a.liq.linha ? a.liq.linha(i) : NaN)
        if (Number.isNaN(ll) || Math.abs(ll - (linha as number)) > 1e-9) return null
      }
      oddLiquidacao = 1 + (ol - 1) * (1 - slippage)
    }
    return { selecao: sel, linha, odd, oddLiquidacao }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Referência (probabilidade justa e odd de fechamento) para EV e CLV
// ────────────────────────────────────────────────────────────────────────────

export interface Referencia {
  /** probabilidade justa da seleção (no-vig proporcional) — NaN sem referência */
  q: number
  /** odd da mesma seleção/linha no fechamento da referência */
  odd: number
  src: 'pinnacle' | 'bet365' | null
}

/** Colunas que a referência pode ler (para o carregamento dos grupos). */
export function camposReferencia(mercado: Mercado, casas: Casa[] = ['pinnacle', 'bet365']): string[] {
  const out: string[] = []
  for (const casa of casas) {
    // dupla chance: q̂ vem do 1X2 (que a Pinnacle tem); a odd de referência só existe na bet365
    if (!casaTemMercado(casa, 'close', mercado === 'dc' ? '1x2' : mercado)) continue
    const b = `odds.${casa}.close`
    switch (mercado) {
      case '1x2': out.push(`${b}.1x2.h`, `${b}.1x2.d`, `${b}.1x2.a`); break
      case 'dc': out.push(`${b}.1x2.h`, `${b}.1x2.d`, `${b}.1x2.a`); if (casa === 'bet365') out.push(`${b}.dc.1x`, `${b}.dc.x2`, `${b}.dc.12`); break
      case 'btts': out.push(`${b}.btts.yes`, `${b}.btts.no`); break
      case 'ou': out.push(`${b}.ou.main_line`, `${b}.ou.over_main`, `${b}.ou.under_main`, ...[0.5, 1.5, 2.5, 3.5, 4.5].flatMap((l) => [`${b}.ou.over_${fmtLinha(l)}`, `${b}.ou.under_${fmtLinha(l)}`])); break
      case 'ht_ou': out.push(`${b}.ht_ou.main_line`, `${b}.ht_ou.over_main`, `${b}.ht_ou.under_main`, ...[0.5, 1.5, 2.5].flatMap((l) => [`${b}.ht_ou.over_${fmtLinha(l)}`, `${b}.ht_ou.under_${fmtLinha(l)}`])); break
      case 'ah': out.push(`${b}.ah.main_line`, `${b}.ah.home_main`, `${b}.ah.away_main`); break
      case 'ht_ah': out.push(`${b}.ht_ah.main_line`, `${b}.ht_ah.home_main`, `${b}.ht_ah.away_main`); break
      case 'corners': out.push(`${b}.corners.main_line`, `${b}.corners.over_main`, `${b}.corners.under_main`); break
      case 'ht_1x2': out.push(`${b}.ht_1x2.h`, `${b}.ht_1x2.d`, `${b}.ht_1x2.a`); break
      case 'eh': for (const s of ['h', 'd', 'a']) for (const l of ['m1', 'm2', 'm3', 'p1', 'p2', 'p3']) out.push(`${b}.eh.${s}_${l}`); break
      case 'cs': for (const s of SELECOES_POR_MERCADO.cs) out.push(`${b}.cs.${s}`); break
    }
  }
  return out
}

/**
 * Referência da perna na linha `i`: tenta a casa preferida (padrão pinnacle) e cai para a outra
 * (bet365, rotulada "soft"). A linha da referência precisa coincidir com a da aposta.
 */
export function resolvedorReferencia(mercado: Mercado, ctx: ContextoCompilacao, preferida: Casa = 'pinnacle'): (i: number, selecao: string, linha: number | null) => Referencia {
  const casas: Casa[] = preferida === 'pinnacle' ? ['pinnacle', 'bet365'] : ['bet365', 'pinnacle']
  const col = (k: string) => { const c = colunaNumerica(ctx, k); return c.length ? (i: number) => c[i] : () => NaN }
  const porCasa = casas.filter((casa) => casaTemMercado(casa, 'close', mercado === 'dc' ? '1x2' : mercado)).map((casa) => {
    const b = `odds.${casa}.close`
    const tres = (p: string) => [col(`${b}.${p}.h`), col(`${b}.${p}.d`), col(`${b}.${p}.a`)]
    switch (mercado) {
      case '1x2': case 'ht_1x2': case 'dc': {
        const [h, d, a] = tres(mercado === 'dc' ? '1x2' : mercado)
        const dc = mercado === 'dc' && casa === 'bet365' ? { '1x': col(`${b}.dc.1x`), x2: col(`${b}.dc.x2`), '12': col(`${b}.dc.12`) } : null
        return (i: number, sel: string): Referencia => {
          const os = [h(i), d(i), a(i)]
          if (os.some((o) => !(o > 1))) return { q: NaN, odd: NaN, src: null }
          const p = M.novig(os)
          const idx: Record<string, number> = { home: 0, draw: 1, away: 2 }
          if (mercado === 'dc') {
            const q = sel === '1x' ? p[0] + p[1] : sel === 'x2' ? p[1] + p[2] : sel === '12' ? p[0] + p[2] : NaN
            return { q, odd: dc?.[sel as '1x']?.(i) ?? NaN, src: casa }
          }
          return { q: p[idx[sel]] ?? NaN, odd: os[idx[sel]] ?? NaN, src: casa }
        }
      }
      case 'btts': {
        const y = col(`${b}.btts.yes`), n = col(`${b}.btts.no`)
        return (i: number, sel: string): Referencia => {
          const os = [y(i), n(i)]
          if (os.some((o) => !(o > 1))) return { q: NaN, odd: NaN, src: null }
          const p = M.novig(os)
          return sel === 'yes' ? { q: p[0], odd: os[0], src: casa } : sel === 'no' ? { q: p[1], odd: os[1], src: casa } : { q: NaN, odd: NaN, src: null }
        }
      }
      case 'ou': case 'ht_ou': case 'corners': {
        const main = col(`${b}.${mercado}.main_line`), om = col(`${b}.${mercado}.over_main`), um = col(`${b}.${mercado}.under_main`)
        const fixas = new Map<number, [Avaliador, Avaliador]>()
        for (const l of LINHAS_FIXAS[mercado] ?? []) fixas.set(l, [col(`${b}.${mercado}.over_${fmtLinha(l)}`), col(`${b}.${mercado}.under_${fmtLinha(l)}`)])
        return (i: number, sel: string, linha: number | null): Referencia => {
          if (linha === null) return { q: NaN, odd: NaN, src: null }
          let o = NaN, u = NaN
          if (Math.abs(main(i) - linha) < 1e-9) { o = om(i); u = um(i) }
          else { const f = fixas.get(linha); if (f) { o = f[0](i); u = f[1](i) } }
          if (!(o > 1) || !(u > 1)) return { q: NaN, odd: NaN, src: null }
          const p = M.novig([o, u])
          return sel === 'over' ? { q: p[0], odd: o, src: casa } : sel === 'under' ? { q: p[1], odd: u, src: casa } : { q: NaN, odd: NaN, src: null }
        }
      }
      case 'ah': case 'ht_ah': {
        const main = col(`${b}.${mercado}.main_line`), hm = col(`${b}.${mercado}.home_main`), am = col(`${b}.${mercado}.away_main`)
        return (i: number, sel: string, linha: number | null): Referencia => {
          if (linha === null || Math.abs(main(i) - linha) > 1e-9) return { q: NaN, odd: NaN, src: null }
          const os = [hm(i), am(i)]
          if (os.some((o) => !(o > 1))) return { q: NaN, odd: NaN, src: null }
          const p = M.novig(os)
          return sel === 'home' ? { q: p[0], odd: os[0], src: casa } : sel === 'away' ? { q: p[1], odd: os[1], src: casa } : { q: NaN, odd: NaN, src: null }
        }
      }
      case 'eh': {
        const cols = new Map<string, Avaliador>()
        for (const s of ['h', 'd', 'a']) for (const l of ['m1', 'm2', 'm3', 'p1', 'p2', 'p3']) cols.set(`${s}_${l}`, col(`${b}.eh.${s}_${l}`))
        return (i: number, sel: string, linha: number | null): Referencia => {
          if (linha === null || !Number.isInteger(linha) || linha === 0) return { q: NaN, odd: NaN, src: null }
          const suf = `${linha < 0 ? 'm' : 'p'}${Math.abs(linha)}`
          const os = ['h', 'd', 'a'].map((s) => cols.get(`${s}_${suf}`)?.(i) ?? NaN)
          if (os.some((o) => !(o > 1))) return { q: NaN, odd: NaN, src: null }
          const p = M.novig(os)
          const idx: Record<string, number> = { home: 0, draw: 1, away: 2 }
          return { q: p[idx[sel]] ?? NaN, odd: os[idx[sel]] ?? NaN, src: casa }
        }
      }
      case 'cs': {
        const cols = SELECOES_POR_MERCADO.cs.map((s) => [s, col(`${b}.cs.${s}`)] as const)
        return (i: number, sel: string): Referencia => {
          const os = cols.map(([, f]) => f(i))
          if (os.some((o) => !(o > 1))) return { q: NaN, odd: NaN, src: null }
          const p = M.novig(os)
          const k = cols.findIndex(([s]) => s === sel)
          return k >= 0 ? { q: p[k], odd: os[k], src: casa } : { q: NaN, odd: NaN, src: null }
        }
      }
    }
  })
  return (i, selecao, linha) => {
    for (const f of porCasa) { const r = f(i, selecao, linha); if (!Number.isNaN(r.q)) return r }
    return { q: NaN, odd: NaN, src: null }
  }
}

/** Campos que uma entrada pode ler (odds de decisão/liquidação, todas as seleções do mercado). */
export function camposDaEntrada(e: Entrada): string[] {
  const out = new Set<string>()
  const precos = [e.preco, e.liquidacao ?? e.preco]
  const linhas: (number | 'main' | null)[] = e.mercado === 'eh'
    ? [-3, -2, -1, 1, 2, 3]
    : typeof e.linha === 'number' && LINHAS_FIXAS[e.mercado]?.includes(e.linha) ? [e.linha] : e.linha && typeof e.linha === 'object' ? ['main', ...(LINHAS_FIXAS[e.mercado] ?? [])] : ['main']
  for (const p of precos) for (const sel of SELECOES_POR_MERCADO[e.mercado]) for (const l of linhas) {
    const ch = chavesOdd(e.mercado, p.casa, p.snapshot, sel, l)
    if (ch) { out.add(ch.odd); if (ch.linha) out.add(ch.linha) }
  }
  return Array.from(out)
}

export const codigoSelecao = (sel: string): number => CODIGO_SELECAO[(sel.startsWith('dc_') ? sel : ['1x', 'x2', '12'].includes(sel) ? `dc_${sel}` : sel) as keyof typeof CODIGO_SELECAO] ?? NaN
