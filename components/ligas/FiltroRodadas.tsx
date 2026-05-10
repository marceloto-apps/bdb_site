'use client'

import React, { useMemo, useCallback, useRef } from 'react'
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

  // Ref para guardar valores anteriores e evitar chamadas redundantes
  const prevRef = useRef({ from: valueFrom, to: valueTo })

  // Memoizar o array do slider para evitar re-renders desnecessários
  const sliderValue = useMemo(() => [currentFrom, currentTo], [currentFrom, currentTo])

  const handleSliderChange = useCallback((vals: number[]) => {
    if (vals.length === 2) {
      const newFrom = vals[0] === min ? null : vals[0]
      const newTo = vals[1] === max ? null : vals[1]
      // Só dispara se realmente mudou
      if (newFrom !== prevRef.current.from || newTo !== prevRef.current.to) {
        prevRef.current = { from: newFrom, to: newTo }
        onChange(newFrom, newTo)
      }
    }
  }, [min, max, onChange])

  const handleInputFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) return
    if (val < min) val = min
    if (val > currentTo) val = currentTo
    const newFrom = val === min ? null : val
    if (newFrom !== valueFrom) {
      prevRef.current = { from: newFrom, to: valueTo }
      onChange(newFrom, valueTo)
    }
  }

  const handleInputToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value)
    if (isNaN(val)) return
    if (val > max) val = max
    if (val < currentFrom) val = currentFrom
    const newTo = val === max ? null : val
    if (newTo !== valueTo) {
      prevRef.current = { from: valueFrom, to: newTo }
      onChange(valueFrom, newTo)
    }
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
          value={sliderValue}
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
