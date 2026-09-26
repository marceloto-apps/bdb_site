/** Formatadores da UI do Laboratório (pt-BR). NaN/null/undefined → "—". */

const vazio = (v: unknown): v is null | undefined => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))

export function num(v: number | null | undefined, casas = 2): string {
  if (vazio(v)) return '—'
  if (v === Infinity) return '∞'
  if (v === -Infinity) return '−∞'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}

export function pct(v: number | null | undefined, casas = 2): string {
  if (vazio(v)) return '—'
  return `${(v * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
}

export function sinal(v: number | null | undefined, casas = 2): string {
  if (vazio(v)) return '—'
  const s = num(v, casas)
  return v > 0 ? `+${s}` : s
}

export function unidades(v: number | null | undefined, casas = 2): string {
  return vazio(v) ? '—' : `${sinal(v, casas)} u`
}

export function inteiro(v: number | null | undefined): string {
  return vazio(v) ? '—' : v.toLocaleString('pt-BR')
}

export function dataCurta(ms: number | null | undefined): string {
  if (vazio(ms)) return '—'
  return new Date(ms).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

export function odd(v: number | null | undefined): string {
  return num(v, 2)
}

/** Cor semântica para um valor (positivo/negativo/neutro). */
export function corSinal(v: number | null | undefined): string {
  if (vazio(v) || v === 0) return 'text-muted-foreground'
  return v > 0 ? 'text-primary' : 'text-data-red'
}

/** "12,3 MB" */
export function bytes(v: number): string {
  if (v < 1024) return `${v} B`
  if (v < 1048576) return `${(v / 1024).toFixed(0)} KB`
  return `${(v / 1048576).toFixed(1)} MB`
}
