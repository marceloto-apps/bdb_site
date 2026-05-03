'use client'

import { useState, useMemo } from 'react'
import { PainelParametros } from './PainelParametros'
import { GraficoCurva } from './GraficoCurva'
import { gerarCurvasDistribuicao, calcularEstatisticasCentrais } from '@/lib/ferramentas/distribuicao/estatisticas'
import type { DistribuicaoInputs } from '@/lib/ferramentas/distribuicao/types'
import { FlaskConical } from 'lucide-react'

export function DistribuicaoTool() {
  const [inputs, setInputs] = useState<DistribuicaoInputs>({
    baseMean: 0,
    stdDev: 1,
    skewness: 0,
    kurtosis: 3
  })

  const chartData = useMemo(() => gerarCurvasDistribuicao(inputs), [inputs])
  const stats = useMemo(() => calcularEstatisticasCentrais(chartData, inputs), [chartData, inputs])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-2xl">
        <div className="bg-primary/20 p-3 rounded-xl">
          <FlaskConical className="text-primary" size={24} />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">
            Simulador de Distribuição
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Laboratório Visual: Gram-Charlier Tipo A
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <PainelParametros inputs={inputs} setInputs={setInputs} />
        </div>
        <div className="lg:col-span-8">
          <GraficoCurva data={chartData} stats={stats} />
        </div>
      </div>
    </div>
  )
}
