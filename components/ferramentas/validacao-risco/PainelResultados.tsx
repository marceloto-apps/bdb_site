import type { MonteCarloResults } from '@/lib/ferramentas/validacao-risco/types'
import { ShieldCheck, DollarSign } from 'lucide-react'

interface PainelResultadosProps {
  results: MonteCarloResults
}

export function PainelResultados({ results }: PainelResultadosProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl text-center">
          <p className="text-xs font-black text-primary uppercase mb-1">Volume Validador</p>
          <p className="text-2xl font-black text-foreground">{results.volumeNecessario.toLocaleString()}</p>
          <span className="text-xs text-muted-foreground uppercase font-bold">Base de Confiança</span>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl text-center">
          <p className="text-xs font-black text-muted-foreground uppercase mb-1">Prob. Lucro</p>
          <p className="text-2xl font-black text-primary">{results.probLucro.toFixed(1)}%</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl text-center">
          <p className="text-xs font-black text-muted-foreground uppercase mb-1">Sobrevivência</p>
          <p className={`text-2xl font-black ${results.survivalRate > 90 ? 'text-primary' : 'text-data-red'}`}>
            {results.survivalRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl text-center">
          <p className="text-xs font-black text-muted-foreground uppercase mb-1">P-Value</p>
          <p className={`text-2xl font-black ${results.pValue < 0.05 ? 'text-primary' : 'text-data-red'}`}>
            {results.pValue.toFixed(4)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-lg">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldCheck size={14} className="text-primary" /> ROI Real Estimado (95%)
          </h3>
          <div className="flex gap-4">
            <div className="flex-1 text-center p-4 bg-data-red/10 rounded-xl border border-data-red/20">
              <span className="text-xs text-muted-foreground uppercase font-black block mb-1">Pior Caso</span>
              <span className="text-xl font-black text-data-red">{results.piorROI.toFixed(2)}%</span>
            </div>
            <div className="flex-1 text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
              <span className="text-xs text-muted-foreground uppercase font-black block mb-1">Melhor Caso</span>
              <span className="text-xl font-black text-primary">{results.melhorROI.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl flex justify-between items-center shadow-lg">
          <div>
            <span className="text-xs font-black uppercase text-primary block mb-1 tracking-widest">
              Lucro Total Estimado
            </span>
            <div className="text-4xl font-black text-foreground tracking-tighter">
              +{results.totalProfit.toFixed(1)}u
            </div>
          </div>
          <DollarSign className="text-primary opacity-20" size={48} />
        </div>
      </div>
    </div>
  )
}
