'use client'

import React, { useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MESES_PT } from '@/types/liga'
import { ChevronDown } from 'lucide-react'

interface FiltroMesProps {
  selectedMonths: number[]
  onChange: (months: number[]) => void
}

export function FiltroMes({ selectedMonths, onChange }: FiltroMesProps) {
  const isAll = selectedMonths.length === 0 || selectedMonths.length === 12

  const summary = useMemo(() => {
    if (isAll) return 'Todos'
    if (selectedMonths.length <= 3) {
      return selectedMonths
        .sort((a, b) => a - b)
        .map(m => MESES_PT[m])
        .join(', ')
    }
    return `${selectedMonths.length} selecionados`
  }, [selectedMonths, isAll])

  const handleToggle = (month: number) => {
    let newSelection = [...selectedMonths]
    if (isAll) {
      // Se estava tudo selecionado e desmarca um, mantém os outros 11
      newSelection = Object.keys(MESES_PT).map(Number).filter(m => m !== month)
    } else {
      if (newSelection.includes(month)) {
        newSelection = newSelection.filter(m => m !== month)
      } else {
        newSelection.push(month)
      }
    }
    
    // Se selecionou todos os 12, manda array vazio para representar "todos"
    if (newSelection.length === 12) {
      newSelection = []
    }
    onChange(newSelection)
  }

  const handleSelectAll = () => onChange([])
  
  // Limpar = nenhum selecionado = sem filtro (= todos)
  const handleClear = () => onChange([])

  const handleTurno1 = () => onChange([4, 5, 6, 7, 8, 9])
  const handleTurno2 = () => onChange([10, 11, 12, 1, 2, 3])

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold mb-1">Meses</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal">
            <span className="truncate">Meses: {summary}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="start">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {Object.entries(MESES_PT).map(([numStr, label]) => {
              const num = parseInt(numStr)
              const checked = isAll || selectedMonths.includes(num)
              return (
                <div key={num} className="flex items-center space-x-2">
                  <Checkbox
                    id={`month-${num}`}
                    checked={checked}
                    onCheckedChange={() => handleToggle(num)}
                  />
                  <label
                    htmlFor={`month-${num}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
            <Button variant="secondary" size="sm" onClick={handleSelectAll} className="flex-1 text-xs">
              Todos
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClear} className="flex-1 text-xs">
              Limpar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleTurno1} className="flex-1 text-xs">
              1° turno
            </Button>
            <Button variant="secondary" size="sm" onClick={handleTurno2} className="flex-1 text-xs">
              2° turno
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
