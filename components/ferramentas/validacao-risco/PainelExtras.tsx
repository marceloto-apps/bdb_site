'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Target, TrendingUp } from 'lucide-react'
import type { MonteCarloResults } from '@/lib/ferramentas/validacao-risco/types'

interface PainelExtrasProps {
  results: MonteCarloResults
  limiteDrawdown: number
  stakeEscolhida: number
}

export function PainelExtras({ results, limiteDrawdown, stakeEscolhida }: PainelExtrasProps) {
  // Stake otimizada: reduz proporcionalmente para que o DD médio
  // fique abaixo do limite definido pelo usuário
  const stakeOtimizada = results.avgMDD > 0
    ? Math.min(stakeEscolhida, (limiteDrawdown / results.avgMDD) * stakeEscolhida * 0.8)
    : stakeEscolhida

  // Score de qualidade: razão entre lucro e risco (DD médio)
  const scoreQualidade = results.avgMDD > 0
    ? results.totalProfit / results.avgMDD
    : 0

  // Barra visual do score (0 a 10 como range razoável)
  const scoreNormalizado = Math.min(100, (scoreQualidade / 10) * 100)

  let colorClass = 'text-red-500'
  let bgColorClass = 'bg-red-500'

  if (scoreQualidade > 5) {
    colorClass = 'text-green-500'
    bgColorClass = 'bg-green-500'
  } else if (scoreQualidade > 2) {
    colorClass = 'text-yellow-500'
    bgColorClass = 'bg-yellow-500'
  }

  return (
    <div className="space-y-4 mt-6">
      {/* Stake Otimizada Sugerida */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase text-primary">
              Stake Otimizada Sugerida
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stakeOtimizada.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ajuste sugerido para não quebrar no DD limite
          </p>
        </CardContent>
      </Card>

      {/* Score de Qualidade */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${colorClass}`} />
              <span className="text-xs font-semibold uppercase text-muted-foreground">
                Score de Qualidade
              </span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {scoreQualidade.toFixed(2)}
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`${bgColorClass} h-2 rounded-full transition-all`}
              style={{ width: `${scoreNormalizado}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Eficiência do Método</span>
            <span className="text-xs text-muted-foreground">Lucro / DD Médio</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
