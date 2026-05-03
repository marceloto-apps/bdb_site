import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { useMemo } from 'react'
import type { MonteCarloInputs } from '@/lib/ferramentas/validacao-risco/types'
import { Calculator, Clock } from 'lucide-react'

interface PainelEntradasProps {
  inputs: MonteCarloInputs
  setInputs: (inputs: MonteCarloInputs) => void
}

export function PainelEntradas({ inputs, setInputs }: PainelEntradasProps) {
  const entradasPorMes = useMemo(() => {
    return Number((inputs.numBets / Math.max(1, inputs.tempoMeses)).toFixed(1))
  }, [inputs.numBets, inputs.tempoMeses])

  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-xl space-y-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Calculator size={14} className="text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Parâmetros de Entrada
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase">Banca Inicial</Label>
          <Input 
            type="number" 
            value={inputs.banca} 
            onChange={e => setInputs({...inputs, banca: Number(e.target.value)})} 
            className="font-black text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase">ROI Esperado %</Label>
          <Input 
            type="number" 
            step="0.1" 
            value={inputs.roiEsperado} 
            onChange={e => setInputs({...inputs, roiEsperado: Number(e.target.value)})} 
            className="font-black text-lg text-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase">Odd Média</Label>
          <Input 
            type="number" 
            step="0.01" 
            value={inputs.oddsMedia} 
            onChange={e => setInputs({...inputs, oddsMedia: Number(e.target.value)})} 
            className="font-black text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-muted-foreground uppercase">Total de Bets</Label>
          <Input 
            type="number" 
            value={inputs.numBets} 
            onChange={e => setInputs({...inputs, numBets: Number(e.target.value)})} 
            className="font-black text-lg"
          />
        </div>
      </div>

      <div className="bg-background p-4 rounded-xl border border-border flex justify-between items-center">
        <div className="space-y-2">
          <Label className="text-xs font-black text-primary uppercase flex items-center gap-1">
            <Clock size={12} /> Tempo Amostra (Meses)
          </Label>
          <Input 
            type="number" 
            value={inputs.tempoMeses} 
            onChange={e => setInputs({...inputs, tempoMeses: Math.max(1, Number(e.target.value))})} 
            className="font-black text-xl w-24"
          />
        </div>
        <div className="text-right">
          <Label className="text-xs font-black text-muted-foreground uppercase">Entradas/Mês</Label>
          <div className="text-xl font-black text-foreground">{entradasPorMes}</div>
        </div>
      </div>

      <div className="bg-primary/10 p-5 rounded-xl border border-primary/20">
        <div className="mb-3">
          <Label className="text-xs font-black text-primary uppercase tracking-wider">Stake Atual Escolhida (%)</Label>
        </div>
        <div className="mb-3">
          <Input 
            type="number" 
            step="0.1" 
            value={inputs.stakeEscolhida} 
            onChange={e => setInputs({...inputs, stakeEscolhida: Number(e.target.value)})} 
            className="font-black text-2xl border-primary/30"
          />
        </div>
        <p className="text-xs text-muted-foreground uppercase leading-normal">
          Aumentar a stake amplia a variância e o volume necessário para validação.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <Label className="text-xs font-black text-data-red uppercase">Risco Máximo (Max DD Limite)</Label>
          <span className="text-xs font-black text-foreground">{inputs.limiteDrawdown}%</span>
        </div>
        <Slider 
          min={5} 
          max={95} 
          step={1}
          value={[inputs.limiteDrawdown]} 
          onValueChange={([val]) => setInputs({...inputs, limiteDrawdown: val})} 
          className="w-full"
        />
      </div>
    </div>
  )
}
