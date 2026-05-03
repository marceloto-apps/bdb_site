import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OddsReferencia25, MarketStats25 } from '@/lib/ferramentas/over-under-25/types'

interface InputsReferenciaProps {
  inputs: OddsReferencia25
  setInputs: (inputs: OddsReferencia25) => void
  stats: MarketStats25
}

export function InputsReferencia({ inputs, setInputs, stats }: InputsReferenciaProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-2xl">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0 text-center md:text-left">
          <h1 className="text-xl font-black text-foreground italic flex items-center justify-center md:justify-start gap-2">
            <span className="text-primary">MARKET</span> ANALYZER
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Juice extraída dos inputs
          </p>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">Under 2.5 (Referência)</Label>
            <div className="bg-muted/50 border-2 border-primary/20 rounded-xl p-3 text-center focus-within:border-primary/50 transition-all">
              <Input 
                type="number" 
                step="0.01" 
                value={inputs.under} 
                onChange={e => setInputs({...inputs, under: Number(e.target.value)})}
                className="bg-transparent border-0 text-2xl font-black text-foreground text-center w-full focus-visible:ring-0 shadow-none"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-2">Over 2.5 (Referência)</Label>
            <div className="bg-muted/50 border-2 border-data-red/20 rounded-xl p-3 text-center focus-within:border-data-red/50 transition-all">
              <Input 
                type="number" 
                step="0.01" 
                value={inputs.over} 
                onChange={e => setInputs({...inputs, over: Number(e.target.value)})}
                className="bg-transparent border-0 text-2xl font-black text-foreground text-center w-full focus-visible:ring-0 shadow-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-6 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-8 justify-center">
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Juice na 2.5</p>
            <p className="text-lg font-black text-foreground">{stats.juice.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">λ Gols</p>
            <p className="text-lg font-black text-primary">{stats.lambda.toFixed(3)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
