'use client'

import React from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { FaixaOddsSelection } from '@/types/liga'

interface FiltroFaixaOddsProps {
  label: string
  faixas: FaixaOddsSelection[]
  onChange: (faixas: FaixaOddsSelection[]) => void
}

export function FiltroFaixaOdds({ label, faixas, onChange }: FiltroFaixaOddsProps) {
  const isAllSelected = faixas.every(f => f.selected)

  const handleToggle = (index: number) => {
    const newFaixas = [...faixas]
    newFaixas[index].selected = !newFaixas[index].selected
    onChange(newFaixas)
  }

  const handleSelectAll = () => {
    const newFaixas = faixas.map(f => ({ ...f, selected: true }))
    onChange(newFaixas)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex flex-wrap gap-2">
        {faixas.map((faixa, i) => (
          <Toggle
            key={faixa.label}
            pressed={faixa.selected}
            onPressedChange={() => handleToggle(i)}
            variant="outline"
            size="sm"
            className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2 h-8"
          >
            {faixa.label}
          </Toggle>
        ))}
        {!isAllSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            Todas
          </Button>
        )}
      </div>
    </div>
  )
}
