import React from 'react'
import { StatSummary } from '@/types/estatisticas'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface StatDisplayProps {
  stat: StatSummary
  label: string
}

export function StatDisplay({ stat, label }: StatDisplayProps) {
  if (stat.average === null) {
    return (
      <div className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-border/50">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground italic text-xs">Indisponível</span>
      </div>
    )
  }

  const isSaldo = label.toLowerCase().includes('saldo')

  let cvClass = "bg-muted/40 text-muted-foreground"
  if (stat.coefficientOfVariation !== null) {
    if (stat.coefficientOfVariation <= 0.3) {
      cvClass = "bg-green-500/20 text-green-500"
    } else if (stat.coefficientOfVariation <= 0.7) {
      cvClass = "bg-yellow-500/20 text-yellow-500"
    } else {
      cvClass = "bg-red-500/20 text-red-500"
    }
  }

  return (
    <div className="flex justify-between items-center text-sm py-1.5 border-b last:border-0 border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-base">{stat.average.toFixed(2)}</span>
        
        {!isSaldo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 text-[10px] cursor-help px-1.5 py-0.5 rounded transition-colors ${cvClass}`}>
                  <span>DP: {stat.standardDeviation?.toFixed(2) ?? '-'}</span>
                  <span>|</span>
                  <span>CV: {stat.coefficientOfVariation !== null ? stat.coefficientOfVariation.toFixed(2) : '-'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="text-xs max-w-[200px]">
                <p className="mb-1"><strong>DP (Desvio Padrão):</strong> mostra o quanto os dados variam em relação à média.</p>
                <p><strong>CV (Coeficiente de Variação):</strong> mede a instabilidade da métrica. Quanto menor, mais consistente.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}
