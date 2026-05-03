'use client'

import { useState } from 'react'
import { PainelEntradas } from './PainelEntradas'
import { PainelResultados } from './PainelResultados'
import { CurvasPatrimonio } from './CurvasPatrimonio'
import { HistogramaDrawdown } from './HistogramaDrawdown'
import { PainelExtras } from './PainelExtras'
import { Glossario } from './Glossario'
import { Zap, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { executarMonteCarlo } from '@/lib/ferramentas/validacao-risco/monte-carlo'
import type { MonteCarloInputs, MonteCarloResults } from '@/lib/ferramentas/validacao-risco/types'

export function ValidacaoRiscoTool() {
  const [inputs, setInputs] = useState<MonteCarloInputs>({
    banca: 1000,
    oddsMedia: 2.00,
    roiEsperado: 5.0,
    numBets: 1000,
    tempoMeses: 6,
    limiteDrawdown: 25,
    stakeEscolhida: 1.0, 
    simulacoesCount: 1000
  })

  const [results, setResults] = useState<MonteCarloResults | null>(null)

  const handleSimular = () => {
    const res = executarMonteCarlo(inputs)
    setResults(res)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-yellow-400 p-2 rounded-lg">
            <Zap className="text-black fill-black" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight italic">
              Validação e Risco
            </h1>
            <p className="text-primary text-xs font-bold uppercase italic">
              Análise de Risco Real e Eficiência Técnica
            </p>
          </div>
        </div>
        <Button 
          onClick={handleSimular}
          className="w-full md:w-auto font-black px-10 transition-all shadow-lg uppercase text-sm tracking-widest"
        >
          Simular {inputs.simulacoesCount.toLocaleString()} Cenários
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <PainelEntradas inputs={inputs} setInputs={setInputs} />
          {results && (
            <PainelExtras
              results={results}
              limiteDrawdown={inputs.limiteDrawdown}
              stakeEscolhida={inputs.stakeEscolhida}
            />
          )}
        </div>

        <div className="lg:col-span-8">
          {results ? (
            <>
              <PainelResultados results={results} />
              <CurvasPatrimonio data={results.chartData} />
              <HistogramaDrawdown
                histData={results.histData}
                avgMDD={results.avgMDD}
                worstDD={results.worstDD}
                simulacoesCount={inputs.simulacoesCount}
              />
            </>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-card rounded-2xl border border-dashed border-border text-muted-foreground">
              <div className="bg-muted p-6 rounded-full mb-6">
                <AlertTriangle size={48} className="text-yellow-500 opacity-50" />
              </div>
              <h3 className="text-lg font-black text-foreground uppercase mb-2">Simulação Pendente</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
                Clique no botão superior para rodar {inputs.simulacoesCount.toLocaleString()} cenários de Monte Carlo.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {results && <Glossario />}
    </div>
  )
}
