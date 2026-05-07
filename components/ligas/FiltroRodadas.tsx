'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'

interface FiltroRodadasProps {
  min: number
  max: number
  valueFrom: number | null
  valueTo: number | null
  onChange: (from: number | null, to: number | null) => void
}

export function FiltroRodadas({ min, max, valueFrom, valueTo, onChange }: FiltroRodadasProps) {
  const currentFrom = valueFrom ?? min
  const currentTo = valueTo ?? max

  const isAllRounds = currentFrom === min && currentTo === max

  // shadcn Slider suporta múltiplos valores se passarmos um array de 2 itens
  const handleSliderChange = (vals: number[]) => {
    if (vals.length === 2) {
      const newFrom = vals[0]
      const newTo = vals[1]
      onChange(newFrom === min ? null : newFrom, newTo === max ? null : newTo)
    }
  }

  const handleInputFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) return
    if (val < min) val = min
    if (val > currentTo) val = currentTo
    onChange(val === min ? null : val, valueTo)
  }

  const handleInputToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) return
    if (val > max) val = max
    if (val < currentFrom) val = currentFrom
    onChange(valueFrom, val === max ? null : val)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Rodadas</Label>
        <span className="text-xs text-muted-foreground">
          {isAllRounds ? 'Todas as rodadas' : `Rodada ${currentFrom} a ${currentTo}`}
        </span>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Slider
          min={min}
          max={max}
          step={1}
          value={[currentFrom, currentTo]}
          onValueChange={handleSliderChange}
          className="flex-1"
        />

        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={min}
            max={currentTo}
            value={currentFrom}
            onChange={handleInputFromChange}
            className="w-16 h-8 text-center text-xs"
          />
          <span className="text-muted-foreground text-xs">até</span>
          <Input
            type="number"
            min={currentFrom}
            max={max}
            value={currentTo}
            onChange={handleInputToChange}
            className="w-16 h-8 text-center text-xs"
          />
        </div>
      </div>
    </div>
  )
}
