import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import type { DistribuicaoInputs } from '@/lib/ferramentas/distribuicao/types'
import { Settings2 } from 'lucide-react'

interface PainelControlesProps {
  inputs: DistribuicaoInputs
  setInputs: (inputs: DistribuicaoInputs) => void
}

export function PainelParametros({ inputs, setInputs }: PainelControlesProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-2xl h-full flex flex-col">
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-6">
        <Settings2 size={16} className="text-primary" />
        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
          Parâmetros (Gram-Charlier)
        </h2>
      </div>

      <div className="space-y-8 flex-1">
        {/* Média Base */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <Label className="text-xs font-bold text-muted-foreground uppercase">
              Média Base (μ)
            </Label>
            <span className="text-lg font-black text-foreground">{inputs.baseMean.toFixed(1)}</span>
          </div>
          <Slider
            min={-4} max={4} step={0.1}
            value={[inputs.baseMean]}
            onValueChange={([val]) => setInputs({ ...inputs, baseMean: val })}
          />
        </div>

        {/* Desvio Padrão */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <Label className="text-xs font-bold text-muted-foreground uppercase">
              Desvio Padrão (σ)
            </Label>
            <span className="text-lg font-black text-foreground">{inputs.stdDev.toFixed(1)}</span>
          </div>
          <Slider
            min={0.6} max={2.5} step={0.1}
            value={[inputs.stdDev]}
            onValueChange={([val]) => setInputs({ ...inputs, stdDev: val })}
          />
        </div>

        {/* Assimetria */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <Label className="text-xs font-bold text-primary uppercase">
              Assimetria (Skewness)
            </Label>
            <span className="text-lg font-black text-primary">{inputs.skewness.toFixed(1)}</span>
          </div>
          <Slider
            min={-2} max={2} step={0.1}
            value={[inputs.skewness]}
            onValueChange={([val]) => setInputs({ ...inputs, skewness: val })}
          />
          <p className="text-[10px] text-muted-foreground uppercase leading-tight">
            Desloca a massa para a esquerda (negativo) ou direita (positivo).
          </p>
        </div>

        {/* Curtose */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <Label className="text-xs font-bold text-data-red uppercase">
              Curtose (Kurtosis)
            </Label>
            <span className="text-lg font-black text-data-red">{inputs.kurtosis.toFixed(1)}</span>
          </div>
          <Slider
            min={1.5} max={6} step={0.1}
            value={[inputs.kurtosis]}
            onValueChange={([val]) => setInputs({ ...inputs, kurtosis: val })}
          />
          <p className="text-[10px] text-muted-foreground uppercase leading-tight">
            Normal = 3. Maior que 3 engorda as caudas (risco extremo).
          </p>
        </div>
      </div>

      {/* Legenda das linhas de referência */}
      <div className="pt-6 mt-6 border-t border-border space-y-3">
        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          Linhas de Referência
        </h3>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-5 h-[2.5px] bg-rose-500 rounded-full" />
            <span className="text-[11px] text-muted-foreground">Média (sensível a extremos)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-[2px] bg-green-500 rounded-full opacity-80"
              style={{ borderTop: '2px dashed #22c55e', background: 'none' }} />
            <span className="text-[11px] text-muted-foreground">Mediana (intermediária)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-[2px] rounded-full"
              style={{ borderTop: '2px dotted #f59e0b', background: 'none' }} />
            <span className="text-[11px] text-muted-foreground">Moda (ponto mais alto)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-[1px] bg-muted-foreground/40 rounded-full"
              style={{ borderTop: '1.5px dashed hsl(var(--muted-foreground))', background: 'none' }} />
            <span className="text-[11px] text-muted-foreground">±1σ, ±2σ (desvios)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
