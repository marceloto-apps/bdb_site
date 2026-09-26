/** CSV das apostas (todas as colunas usadas + extras), `;` e BOM para abrir direto no Excel pt-BR. */

interface ApostaCsv {
  data: number | null; competicao: string; temporada: string; home: string; away: string; entradaId: string; mercado: string; selecao: string; linha: number | null
  odd: number | null; oddLiquidacao: number | null; stake: number | null; resultado: string; pnl: number | null; banco: number | null
  qRef: number | null; oddRef: number | null; refSrc: string | null; ev: number | null; clvBruto: number | null; clvNovig: number | null; clvPontos: number | null
  extras?: Record<string, number | string | null>
}

export function csvApostas(apostas: ApostaCsv[], separador = ';'): string {
  const extras = new Set<string>()
  for (const a of apostas) for (const k of Object.keys(a.extras ?? {})) extras.add(k)
  const cols = ['data', 'competicao', 'temporada', 'mandante', 'visitante', 'entrada', 'mercado', 'selecao', 'linha', 'odd', 'odd_liquidacao', 'stake', 'resultado', 'pnl', 'banco', 'prob_ref', 'odd_ref', 'fonte_ref', 'ev', 'clv_bruto', 'clv_novig', 'clv_pontos', ...Array.from(extras)]
  const esc = (v: unknown) => {
    if (v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v))) return ''
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const linhas = [cols.join(separador)]
  for (const a of apostas) {
    const base: unknown[] = [a.data === null ? '' : new Date(a.data).toISOString().slice(0, 16).replace('T', ' '), a.competicao, a.temporada, a.home, a.away, a.entradaId, a.mercado, a.selecao, a.linha, a.odd, a.oddLiquidacao, a.stake, a.resultado, a.pnl, a.banco, a.qRef, a.oddRef, a.refSrc, a.ev, a.clvBruto, a.clvNovig, a.clvPontos, ...Array.from(extras).map((k) => a.extras?.[k] ?? null)]
    linhas.push(base.map(esc).join(separador))
  }
  return `﻿${linhas.join('\n')}`
}

export function baixarTexto(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nome
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}
