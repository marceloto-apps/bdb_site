'use client'

import React, { useMemo } from 'react'
import { FiltrosLiga } from '@/types/liga'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FiltroRodadas } from './FiltroRodadas'
import { FiltroMes } from './FiltroMes'
import { FiltroFaixaOdds } from './FiltroFaixaOdds'
import { ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react'

interface FiltrosAvancadosProps {
  filtros: FiltrosLiga
  maxRodada: number
  onFiltrosChange: (filtros: Partial<FiltrosLiga>) => void
  onAplicar: () => void
  onLimpar: () => void
  isCalculando?: boolean
  availableOddsCasa?: boolean[]
  availableOddsVisitante?: boolean[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function FiltrosAvancados({
  filtros,
  maxRodada,
  onFiltrosChange,
  onAplicar,
  onLimpar,
  isCalculando,
  availableOddsCasa,
  availableOddsVisitante,
  isOpen,
  onOpenChange,
}: FiltrosAvancadosProps) {
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filtros.roundFrom !== null || filtros.roundTo !== null) count++
    if (filtros.months.length > 0 && filtros.months.length < 12) count++
    
    // Nenhum selecionado = todos = sem filtro; Todos selecionados = sem filtro
    const casaSelecionados = filtros.oddsCasa.filter(f => f.selected).length
    if (casaSelecionados > 0 && casaSelecionados < filtros.oddsCasa.length) count++
    
    const visSelecionados = filtros.oddsVisitante.filter(f => f.selected).length
    if (visSelecionados > 0 && visSelecionados < filtros.oddsVisitante.length) count++
    
    return count
  }, [filtros])

  return (
    <div className="p-4 md:p-5 bg-card border rounded-lg shadow-sm">
      <Collapsible open={isOpen} onOpenChange={onOpenChange} className="w-full">
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
                label="Odds Casa" 
                faixas={filtros.oddsCasa} 
                available={availableOddsCasa}
                onChange={(faixas) => onFiltrosChange({ oddsCasa: faixas })} 
              />
              <FiltroFaixaOdds 
                label="Odds Visitante" 
                faixas={filtros.oddsVisitante} 
                available={availableOddsVisitante}
                onChange={(faixas) => onFiltrosChange({ oddsVisitante: faixas })} 
              />
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button
                onClick={onLimpar}
                disabled={isCalculando}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
              <Button
                onClick={onAplicar}
                disabled={isCalculando}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isCalculando ? 'animate-spin' : ''}`} />
                Recalcular com Filtros
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
