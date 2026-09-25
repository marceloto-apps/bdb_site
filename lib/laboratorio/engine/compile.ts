/**
 * Compilador: AST resolvido → função `(i) => number` sobre as colunas do dataset.
 *
 * Convenções de valor: NaN = nulo (propaga); booleanos = 0/1 (com NaN = desconhecido, tratado
 * como falso na máscara final); seleções = códigos de CODIGO_SELECAO. Comparações `==`/`!=`
 * entre textos (coluna de texto, string literal ou constante de seleção) comparam strings.
 */
import { CODIGO_SELECAO, camposDoEscopo, type Escopo, type No } from './ast'
import type { Dataset } from './tipos'
import * as M from './matematica'
import { saidaModelo } from './modelos'

export type Avaliador = (i: number) => number
export type AvaliadorTexto = (i: number) => string | null

export interface ContextoCompilacao {
  dataset: Dataset
  parametros: Record<string, number>
  /** colunas dos indicadores já avaliados */
  indicadores: Map<string, Float64Array>
  /** campos referenciados que não existem no dataset (viram NaN) — para os avisos de cobertura */
  camposAusentes: Set<string>
  /** cache das colunas de rank (chave = JSON do nó) */
  ranks?: Map<string, Float64Array>
}

const VAZIA = new Float64Array(0)

export function colunaNumerica(ctx: ContextoCompilacao, key: string): Float64Array {
  const c = ctx.dataset.numericas.get(key)
  if (c) return c
  if (!ctx.dataset.textos.has(key)) ctx.camposAusentes.add(key)
  return VAZIA
}

function acessoNumerico(ctx: ContextoCompilacao, key: string): Avaliador {
  const c = colunaNumerica(ctx, key)
  if (c.length === 0) return () => NaN
  return (i) => c[i]
}

/** Acessor de texto quando o nó é textual (string, seleção ou coluna de texto); senão null. */
function acessoTexto(no: No, ctx: ContextoCompilacao): AvaliadorTexto | null {
  if (no.t === 'str') { const v = no.v; return () => v }
  if (no.t === 'sel') { const v = no.v; return () => v }
  if (no.t === 'campo') {
    const c = ctx.dataset.textos.get(no.key)
    if (c) return (i) => c[i]
  }
  return null
}

const bool = (v: boolean) => (v ? 1 : 0)

export function compilar(no: No, ctx: ContextoCompilacao): Avaliador {
  switch (no.t) {
    case 'num': { const v = no.v; return () => v }
    case 'str': return () => NaN
    case 'id': throw new Error(`Identificador não resolvido: ${no.nome}`)
    case 'sel': { const v = CODIGO_SELECAO[no.v]; return () => v }
    case 'param': {
      const v = ctx.parametros[no.nome]
      const c = typeof v === 'number' ? v : NaN
      return () => c
    }
    case 'campo': return acessoNumerico(ctx, no.key)
    case 'ind': {
      const c = ctx.indicadores.get(no.nome)
      if (!c) throw new Error(`Indicador não avaliado: ${no.nome}`)
      return (i) => c[i]
    }
    case 'un': {
      const a = compilar(no.a, ctx)
      if (no.op === 'neg') return (i) => -a(i)
      return (i) => { const v = a(i); return Number.isNaN(v) ? NaN : bool(v === 0) }
    }
    case 'bin': return compilarBin(no, ctx)
    case 'call': return compilarCall(no, ctx)
    case 'model': return saidaModelo(no, ctx)
    case 'rank': {
      const col = colunaRank(no, ctx)
      return (i) => col[i]
    }
  }
}

function compilarBin(no: Extract<No, { t: 'bin' }>, ctx: ContextoCompilacao): Avaliador {
  const { op } = no
  if (op === '==' || op === '!=') {
    // texto × (texto | seleção) → compara strings; o resto (inclusive seleção × seleção) compara códigos
    const ehTexto = (n: No) => n.t === 'str' || (n.t === 'campo' && ctx.dataset.textos.has(n.key))
    const ehSel = (n: No) => n.t === 'sel'
    if ((ehTexto(no.a) && (ehTexto(no.b) || ehSel(no.b))) || (ehTexto(no.b) && ehSel(no.a))) {
      const ta = acessoTexto(no.a, ctx) as AvaliadorTexto, tb = acessoTexto(no.b, ctx) as AvaliadorTexto
      const eq = op === '=='
      return (i) => { const x = ta(i), y = tb(i); if (x === null || y === null) return NaN; return bool((x === y) === eq) }
    }
  }
  const a = compilar(no.a, ctx), b = compilar(no.b, ctx)
  switch (op) {
    case '+': return (i) => a(i) + b(i)
    case '-': return (i) => a(i) - b(i)
    case '*': return (i) => a(i) * b(i)
    case '/': return (i) => { const d = b(i); const r = a(i) / d; return Number.isFinite(r) ? r : NaN }
    case '^': return (i) => { const r = Math.pow(a(i), b(i)); return Number.isFinite(r) ? r : NaN }
    case '==': return (i) => { const x = a(i), y = b(i); return Number.isNaN(x) || Number.isNaN(y) ? NaN : bool(x === y) }
    case '!=': return (i) => { const x = a(i), y = b(i); return Number.isNaN(x) || Number.isNaN(y) ? NaN : bool(x !== y) }
    case '<': return (i) => { const x = a(i), y = b(i); return Number.isNaN(x) || Number.isNaN(y) ? NaN : bool(x < y) }
    case '<=': return (i) => { const x = a(i), y = b(i); return Number.isNaN(x) || Number.isNaN(y) ? NaN : bool(x <= y) }
    case '>': return (i) => { const x = a(i), y = b(i); return Number.isNaN(x) || Number.isNaN(y) ? NaN : bool(x > y) }
    case '>=': return (i) => { const x = a(i), y = b(i); return Number.isNaN(x) || Number.isNaN(y) ? NaN : bool(x >= y) }
    case 'and': return (i) => {
      const x = a(i); if (x === 0) return 0
      const y = b(i); if (y === 0) return 0
      return Number.isNaN(x) || Number.isNaN(y) ? NaN : 1
    }
    case 'or': return (i) => {
      const x = a(i); if (x !== 0 && !Number.isNaN(x)) return 1
      const y = b(i); if (y !== 0 && !Number.isNaN(y)) return 1
      return Number.isNaN(x) || Number.isNaN(y) ? NaN : 0
    }
  }
}

function compilarCall(no: Extract<No, { t: 'call' }>, ctx: ContextoCompilacao): Avaliador {
  const args = no.args.map((a) => (a.t === 'str' ? () => NaN : compilar(a, ctx)))
  const [a, b, c] = args
  switch (no.fn) {
    case 'abs': return (i) => Math.abs(a(i))
    case 'floor': return (i) => Math.floor(a(i))
    case 'ceil': return (i) => Math.ceil(a(i))
    case 'sqrt': return (i) => { const v = a(i); return v < 0 ? NaN : Math.sqrt(v) }
    case 'log': return (i) => { const v = a(i); return v <= 0 ? NaN : Math.log(v) }
    case 'exp': return (i) => { const r = Math.exp(a(i)); return Number.isFinite(r) ? r : NaN }
    case 'pow': return (i) => { const r = Math.pow(a(i), b(i)); return Number.isFinite(r) ? r : NaN }
    case 'round': {
      if (!b) return (i) => Math.round(a(i))
      return (i) => { const d = b(i); const f = Math.pow(10, d); return Math.round(a(i) * f) / f }
    }
    case 'quarter': return (i) => M.quarter(a(i))
    case 'clamp': return (i) => { const v = a(i), lo = b(i), hi = c(i); return Number.isNaN(v) ? NaN : Math.min(Math.max(v, lo), hi) }
    case 'min': return (i) => { let m = Infinity; for (const f of args) { const v = f(i); if (Number.isNaN(v)) return NaN; if (v < m) m = v } return m }
    case 'max': return (i) => { let m = -Infinity; for (const f of args) { const v = f(i); if (Number.isNaN(v)) return NaN; if (v > m) m = v } return m }
    case 'ifnull': return (i) => { const v = a(i); return Number.isNaN(v) ? b(i) : v }
    case 'coalesce': return (i) => { for (const f of args) { const v = f(i); if (!Number.isNaN(v)) return v } return NaN }
    case 'isnull': return (i) => bool(Number.isNaN(a(i)))
    case 'if': return (i) => { const v = a(i); if (Number.isNaN(v)) return NaN; return v !== 0 ? b(i) : c(i) }
    case 'implied': return (i) => M.implied(a(i))
    case 'fair_odd': return (i) => M.fairOdd(a(i))
    case 'ev': return (i) => M.ev(a(i), b(i))
    case 'edge': return (i) => M.edge(a(i), b(i))
    case 'kelly': return (i) => M.kelly(a(i), b(i))
    case 'zscore': return (i) => { const sd = c(i); return sd > 0 ? (a(i) - b(i)) / sd : NaN }
    case 'novig': {
      const ult = no.args[no.args.length - 1]
      const metodo = (ult.t === 'str' ? ult.v : 'proportional') as M.MetodoNovig
      const odds = ult.t === 'str' ? args.slice(0, -1) : args
      return (i) => {
        const os = odds.map((f) => f(i))
        if (os.some((o) => Number.isNaN(o))) return NaN
        return M.novig(os, metodo)[0]
      }
    }
    default: throw new Error(`Função não permitida: ${no.fn}`)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Colunas inteiras (indicadores e ranks)
// ────────────────────────────────────────────────────────────────────────────

export function avaliarColuna(no: No, ctx: ContextoCompilacao): Float64Array {
  const f = compilar(no, ctx)
  const n = ctx.dataset.n
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) out[i] = f(i)
  return out
}

/** Máscara booleana (1 = selecionado); NaN conta como falso. */
export function avaliarMascara(no: No, ctx: ContextoCompilacao): Uint8Array {
  const f = compilar(no, ctx)
  const n = ctx.dataset.n
  const out = new Uint8Array(n)
  for (let i = 0; i < n; i++) { const v = f(i); out[i] = v !== 0 && !Number.isNaN(v) ? 1 : 0 }
  return out
}

/** Chave do grupo por escopo (dia UTC, rodada da competição×temporada, competição×temporada). */
export function chaveEscopo(ctx: ContextoCompilacao, escopo: Escopo): (i: number) => string | null {
  const ds = ctx.dataset
  const texto = (k: string) => ds.textos.get(k)
  const num = (k: string) => ds.numericas.get(k)
  for (const k of camposDoEscopo(escopo)) if (!texto(k) && !num(k)) ctx.camposAusentes.add(k)
  switch (escopo) {
    case 'day': {
      const d = num('match.utc_date')
      return (i) => { const v = d?.[i]; return v === undefined || Number.isNaN(v) ? null : String(Math.floor(v / 86400000)) }
    }
    case 'round': {
      const comp = texto('match.competition'), s = texto('match.season'), r = num('match.round')
      return (i) => { const rv = r?.[i]; if (!comp || !s || rv === undefined || Number.isNaN(rv)) return null; return `${comp[i]}|${s[i]}|${rv}` }
    }
    case 'league_season': {
      const comp = texto('match.competition'), s = texto('match.season')
      return (i) => (comp && s && comp[i] !== null && s[i] !== null ? `${comp[i]}|${s[i]}` : null)
    }
  }
}

/**
 * rank: 1 = maior valor do grupo (empates recebem a mesma posição); pct_rank: fração do grupo com
 * valor ≤ x (0..1]. Nulos ficam nulos e não contam.
 */
export function colunaRank(no: Extract<No, { t: 'rank' }>, ctx: ContextoCompilacao): Float64Array {
  const chave = JSON.stringify(no)
  const cache = (ctx.ranks ??= new Map())
  const pronto = cache.get(chave)
  if (pronto) return pronto
  const valores = avaliarColuna(no.expr, ctx)
  const grupoDe = chaveEscopo(ctx, no.escopo)
  const n = ctx.dataset.n
  const grupos = new Map<string, number[]>()
  for (let i = 0; i < n; i++) {
    if (Number.isNaN(valores[i])) continue
    const g = grupoDe(i)
    if (g === null) continue
    let a = grupos.get(g); if (!a) { a = []; grupos.set(g, a) } a.push(i)
  }
  const out = new Float64Array(n).fill(NaN)
  for (const idx of Array.from(grupos.values())) {
    const ord = idx.slice().sort((x: number, y: number) => valores[y] - valores[x]) // decrescente
    const m = ord.length
    for (let k = 0; k < m; k++) {
      const i = ord[k]
      if (no.fn === 'rank') {
        // empates: mesma posição do primeiro do bloco
        let p = k
        while (p > 0 && valores[ord[p - 1]] === valores[i]) p--
        out[i] = p + 1
      } else {
        // fração com valor <= x
        let q = k
        while (q < m - 1 && valores[ord[q + 1]] === valores[i]) q++
        out[i] = (m - q) / m
      }
    }
  }
  cache.set(chave, out)
  return out
}
