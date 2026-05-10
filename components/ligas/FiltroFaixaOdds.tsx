'use client'

import React from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { FaixaOddsSelection } from '@/types/liga'

interface FiltroFaixaOddsProps {
  label: string
  faixas: FaixaOddsSelection[]
  available?: boolean[]
  onChange: (faixas: FaixaOddsSelection[]) => void
}

export function FiltroFaixaOdds({ label, faixas, available, onChange }: FiltroFaixaOddsProps) {
  const hasActiveFilter = faixas.some(f => f.selected) && !faixas.every(f => f.selected)

  const handleToggle = (index: number) => {
    if (available && !available[index]) return
    const newFaixas = faixas.map((f, i) =>
      i === index ? { ...f, selected: !f.selected } : f
    )
    onChange(newFaixas)
  }

  const handleClear = () => {
    const newFaixas = faixas.map(f => ({ ...f, selected: false }))
    onChange(newFaixas)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">
        {faixas.map((faixa, i) => {
          const isAvailable = available ? available[i] : true
          return (
            <Toggle
              key={faixa.label}
              pressed={faixa.selected}
              onPressedChange={() => handleToggle(i)}
              variant="outline"
              size="sm"
              disabled={!isAvailable}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2 h-8 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {faixa.label}
            </Toggle>
          )
        })}
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  )
}
