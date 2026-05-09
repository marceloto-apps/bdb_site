'use client'

import React, { useMemo } from 'react'
import { FiltrosLiga } from '@/types/liga'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FiltroRodadas } from './FiltroRodadas'
import { FiltroMes } from './FiltroMes'
import { FiltroFaixaOdds } from './FiltroFaixaOdds'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FiltrosAvancadosProps {
  filtros: FiltrosLiga
  maxRodada: number
  onFiltrosChange: (filtros: Partial<FiltrosLiga>) => void
}

export function FiltrosAvancados({
  filtros,
  maxRodada,
  onFiltrosChange
}: FiltrosAvancadosProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filtros.roundFrom !== null || filtros.roundTo !== null) count++
    if (filtros.months.length > 0 && filtros.months.length < 12) count++
    
    const oddsCasaChanged = filtros.oddsCasa.some(f => !f.selected)
    if (oddsCasaChanged) count++
    
    const oddsVisChanged = filtros.oddsVisitante.some(f => !f.selected)
    if (oddsVisChanged) count++
    
    return count
  }, [filtros])

  return (
    <div className="p-4 md:p-5 bg-card border rounded-lg shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2 font-medium text-sm">
              Filtros Avançados de Análise
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-6 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              <FiltroRodadas 
                min={1} 
                max={maxRodada} 
                valueFrom={filtros.roundFrom} 
                valueTo={filtros.roundTo} 
                onChange={(from, to) => onFiltrosChange({ roundFrom: from, roundTo: to })} 
              />
              <FiltroMes 
                selectedMonths={filtros.months} 
                onChange={(months) => onFiltrosChange({ months })} 
              />
            </div>
            
            <div className="flex flex-col gap-6">
              <FiltroFaixaOdds 
                label="Odds Casa (Pinnacle)" 
                faixas={filtros.oddsCasa} 
                onChange={(faixas) => onFiltrosChange({ oddsCasa: faixas })} 
              />
              <FiltroFaixaOdds 
                label="Odds Visitante (Pinnacle)" 
                faixas={filtros.oddsVisitante} 
                onChange={(faixas) => onFiltrosChange({ oddsVisitante: faixas })} 
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
