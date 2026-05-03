'use client'

import { useState, useMemo } from 'react'
import { InputsReferencia } from './InputsReferencia'
import { TabelaLinhas } from './TabelaLinhas'
import { extrairJuice25, calcularLinhas25 } from '@/lib/ferramentas/over-under-25/juice'
import { TrendingUp } from 'lucide-react'

export function OverUnder25Tool() {
  const [inputs, setInputs] = useState({
    under: 3.30,
    over: 1.33
  })

  const stats = useMemo(() => extrairJuice25(inputs), [inputs])
  const linhas = useMemo(() => calcularLinhas25(stats.lambda, stats.juice), [stats.lambda, stats.juice])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <InputsReferencia inputs={inputs} setInputs={setInputs} stats={stats} />
      <TabelaLinhas data={linhas} />
      
      <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2 pt-4 border-t border-border mt-6 gap-4 md:gap-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span>Equilíbrio (Ponto de Menor Juice)</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={12} />
          <span>Crescimento Constante: +0.25% p/ Degrau</span>
        </div>
        <div className="text-muted-foreground italic normal-case">
          Odds limitadas ao piso de 1.01 para segurança operacional.
        </div>
      </div>
    </div>
  )
}
