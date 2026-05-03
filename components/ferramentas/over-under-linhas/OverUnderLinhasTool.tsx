'use client'

import { useState, useMemo } from 'react'
import { InputsAncora } from './InputsAncora'
import { TabelaProjecao } from './TabelaProjecao'
import { extrairJuiceAncora, calcularTabelaProjecao } from '@/lib/ferramentas/over-under-linhas/juice'
import type { AncoraInput } from '@/lib/ferramentas/over-under-linhas/types'

export function OverUnderLinhasTool() {
  const [inputs, setInputs] = useState<AncoraInput>({
    line: 2.5,
    under: 1.90,
    over: 1.90
  })

  const stats = useMemo(() => extrairJuiceAncora(inputs), [inputs])
  const tabela = useMemo(() => calcularTabelaProjecao(stats.lambda, stats.juice, inputs.line), [stats.lambda, stats.juice, inputs.line])

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <InputsAncora inputs={inputs} setInputs={setInputs} stats={stats} />
      <TabelaProjecao data={tabela} />
      
      <div className="flex flex-col md:flex-row justify-between items-center px-2 pt-4 border-t border-border mt-6">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-[10px] font-black text-muted-foreground uppercase">Âncora Escolhida</span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-muted-foreground italic mt-4 md:mt-0">
          Odds limitadas ao piso de 1.01 para segurança operacional.
        </div>
      </div>
    </div>
  )
}
