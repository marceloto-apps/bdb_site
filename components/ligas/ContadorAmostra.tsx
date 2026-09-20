import React from 'react'
import type { ResumoAmostra } from '@/lib/analytics/amostra'

interface ContadorAmostraProps {
  resumo?: ResumoAmostra | null
  /** Usado quando a API não devolveu o resumo da amostra */
  fallbackTotal?: number
  rotulo: string // "jogos em casa", "jogos fora", "jogos"
}

export function detalhesCorte(resumo: ResumoAmostra): string[] {
  const partes: string[] = []
  if (resumo.foraFaixaOdds > 0) partes.push(`${resumo.foraFaixaOdds} fora da faixa de odds`)
  if (resumo.semOdd > 0) partes.push(`${resumo.semOdd} sem odd`)
  if (resumo.foraPeriodo > 0) partes.push(`${resumo.foraPeriodo} fora do período`)
  return partes
}

/** "9 de 13 jogos em casa (3 fora da faixa de odds · 1 sem odd)" — ou só "13 jogos em casa" sem corte. */
export function ContadorAmostra({ resumo, fallbackTotal, rotulo }: ContadorAmostraProps) {
  if (!resumo) return <span>{fallbackTotal ?? 0} {rotulo}</span>

  const cortes = detalhesCorte(resumo)
  if (cortes.length === 0) return <span>{resumo.usados} {rotulo}</span>

  return (
    <span>
      {resumo.usados} de {resumo.total} {rotulo}
      <span className="ml-1.5 text-xs font-normal text-muted-foreground">({cortes.join(' · ')})</span>
    </span>
  )
}
