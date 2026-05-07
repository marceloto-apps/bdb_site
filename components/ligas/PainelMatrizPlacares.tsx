'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Grid3x3 } from 'lucide-react'

interface PainelMatrizPlacaresProps {
  matrizPlacares: number[][]
  homeTeamName: string
  awayTeamName: string
  modelo: string
}

export function PainelMatrizPlacares({ matrizPlacares, homeTeamName, awayTeamName, modelo }: PainelMatrizPlacaresProps) {
  
  const getCellBgColor = (prob: number) => {
    // Probabilidade entra como 0.0 a 1.0, então 8% = 0.08
    if (prob >= 0.08) return 'bg-primary/40 text-foreground'
    if (prob >= 0.05) return 'bg-primary/25 text-foreground'
    if (prob >= 0.03) return 'bg-primary/15 text-foreground'
    if (prob >= 0.01) return 'bg-primary/5 text-foreground'
    return 'bg-transparent text-muted-foreground'
  }

  const mapModelo: Record<string, string> = {
    'POISSON': 'Poisson',
    'ZIP': 'Zero-Inflated Poisson',
    'NB': 'Binomial Negativa',
    'DIXON_COLES': 'Dixon-Coles',
  }

  const modelLabel = mapModelo[modelo] || modelo

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-primary" />
          Matriz de Placares — {modelLabel}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col relative">
          
          <div className="flex justify-center items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Gols do Visitante ({awayTeamName})
            </span>
          </div>

          <div className="flex relative">
            <div className="flex items-center justify-center [writing-mode:vertical-rl] rotate-180 min-w-8 pr-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Gols do Mandante ({homeTeamName})
              </span>
            </div>

            <div className="overflow-x-auto pb-4 w-full border rounded-md">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border-b border-r bg-muted/50 sticky left-0 z-10 w-12"></th>
                    {Array.from({ length: 11 }).map((_, a) => (
                      <th key={a} className="p-2 border-b bg-muted/50 min-w-12 font-mono text-sm text-muted-foreground">
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrizPlacares.slice(0, 11).map((row, h) => (
                    <tr key={h}>
                      <th className="p-2 border-r bg-muted/50 font-mono text-sm text-muted-foreground sticky left-0 z-10">
                        {h}
                      </th>
                      {row.slice(0, 11).map((prob, a) => {
                        const probPct = prob * 100
                        const bgColor = getCellBgColor(prob)
                        const isDiagonal = h === a
                        const oddJusta = prob > 0 ? (1 / prob).toFixed(2) : '—'
                        const displayProb = probPct < 0.01 && probPct > 0 ? '<0.01' : probPct.toFixed(2)

                        return (
                          <TooltipProvider key={`${h}-${a}`} delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <td 
                                  className={`
                                    p-1 md:p-2 border transition-colors cursor-default
                                    ${bgColor}
                                    ${isDiagonal ? 'border-yellow-500/50' : 'border-border'}
                                    hover:ring-2 hover:ring-primary hover:z-20 relative
                                  `}
                                >
                                  <span className={`font-mono text-xs md:text-sm ${probPct < 0.01 ? 'opacity-30' : ''}`}>
                                    {probPct < 0.01 ? '-' : displayProb}
                                  </span>
                                </td>
                              </TooltipTrigger>
                              <TooltipContent className="flex flex-col gap-1 p-3">
                                <span className="font-bold border-b pb-1 mb-1 border-border/50">
                                  Placar: {h} × {a}
                                </span>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <span className="text-muted-foreground">Probabilidade:</span>
                                  <span className="font-mono text-right">{probPct.toFixed(2)}%</span>
                                  <span className="text-muted-foreground">Odd Justa:</span>
                                  <span className="font-mono text-right">{oddJusta}</span>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </CardContent>
    </Card>
  )
}
