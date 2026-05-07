'use client'

import React, { useMemo, useState } from 'react'
import { FiltrosLiga, TimeOption } from '@/types/liga'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FiltroRodadas } from './FiltroRodadas'
import { FiltroMes } from './FiltroMes'
import { FiltroFaixaOdds } from './FiltroFaixaOdds'
import { Swords, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface SeletorConfrontoProps {
  times: TimeOption[]
  filtros: FiltrosLiga
  maxRodada: number
  onFiltrosChange: (filtros: Partial<FiltrosLiga>) => void
  onCalcular: () => void
  isCalculating: boolean
  seletorModelo?: React.ReactNode
}

export function SeletorConfronto({
  times,
  filtros,
  maxRodada,
  onFiltrosChange,
  onCalcular,
  isCalculating,
  seletorModelo,
}: SeletorConfrontoProps) {
  const [isOpen, setIsOpen] = useState(false)

  const podeCalcular = filtros.homeTeamId !== null && filtros.awayTeamId !== null

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

  const timesOptionsCasa = times.filter(t => t.id !== filtros.awayTeamId)
  const timesOptionsVisitante = times.filter(t => t.id !== filtros.homeTeamId)

  return (
    <div className="flex flex-col gap-3 p-4 md:p-5 bg-card border rounded-lg shadow-sm">
      {/* Barra principal — tudo em 1 linha no desktop */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        
        {/* Grupo: seletores de times */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <Select 
              value={filtros.homeTeamId || undefined} 
              onValueChange={(val) => onFiltrosChange({ homeTeamId: val })}
            >
              <SelectTrigger className="w-full h-10 text-sm md:text-base">
                <SelectValue placeholder="Selecione o mandante" />
              </SelectTrigger>
              <SelectContent>
                {timesOptionsCasa.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-muted">
            <Swords className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <Select 
              value={filtros.awayTeamId || undefined} 
              onValueChange={(val) => onFiltrosChange({ awayTeamId: val })}
            >
              <SelectTrigger className="w-full h-10 text-sm md:text-base">
                <SelectValue placeholder="Selecione o visitante" />
              </SelectTrigger>
              <SelectContent>
                {timesOptionsVisitante.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {seletorModelo && (
          <>
            {/* Separador vertical (só desktop) */}
            <div className="hidden lg:block w-px h-8 bg-border shrink-0" />
            
            {/* Grupo modelo + botão */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between lg:justify-start w-full lg:w-auto">
              <div className="shrink-0 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                {seletorModelo}
              </div>
              <Button 
                size="default" 
                variant="default" 
                className="shrink-0 whitespace-nowrap h-10"
                disabled={!podeCalcular || isCalculating}
                onClick={onCalcular}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  'Calcular Previsão'
                )}
              </Button>
            </div>
          </>
        )}

        {!seletorModelo && (
          <Button 
            size="default" 
            variant="default" 
            className="shrink-0 whitespace-nowrap mt-2 lg:mt-0 h-10 w-full lg:w-auto"
            disabled={!podeCalcular || isCalculating}
            onClick={onCalcular}
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando...
              </>
            ) : (
              'Calcular Previsão'
            )}
          </Button>
        )}
      </div>

      {/* Filtros Avançados */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-fit p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2 font-medium text-sm">
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-4 pb-2">
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
