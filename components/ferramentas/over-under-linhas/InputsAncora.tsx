import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AncoraInput, ProjecaoStats } from '@/lib/ferramentas/over-under-linhas/types'

interface InputsAncoraProps {
  inputs: AncoraInput
  setInputs: (inputs: AncoraInput) => void
  stats: ProjecaoStats
}

const LINHAS_DISPONIVEIS = [
  1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75, 5.0, 5.25, 5.5
]

export function InputsAncora({ inputs, setInputs, stats }: InputsAncoraProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-2xl">
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="flex-shrink-0 text-center lg:text-left">
          <h1 className="text-xl font-black text-primary italic uppercase tracking-tighter">
            OMNI<span className="text-foreground">PROJECTOR</span>
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            1.50 ATÉ 5.50 (PROTEÇÃO 1.01)
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Linha Âncora</Label>
            <Select 
              value={inputs.line.toString()} 
              onValueChange={(val) => setInputs({ ...inputs, line: Number(val) })}
            >
              <SelectTrigger className="font-black text-lg text-primary h-14">
                <SelectValue placeholder="Selecione a linha" />
              </SelectTrigger>
              <SelectContent>
                {LINHAS_DISPONIVEIS.map(l => (
                  <SelectItem key={l} value={l.toString()}>
                    Linha {l.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Under (Odds)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={inputs.under}
              onChange={(e) => setInputs({ ...inputs, under: Number(e.target.value) })}
              className="text-2xl font-black text-center h-14"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Over (Odds)</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={inputs.over}
              onChange={(e) => setInputs({ ...inputs, over: Number(e.target.value) })}
              className="text-2xl font-black text-center h-14"
            />
          </div>
        </div>

        <div className="flex gap-4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6 h-full items-center justify-center">
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Juice Âncora</p>
            <p className="text-lg font-black text-foreground">{stats.juice.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">λ Calculado</p>
            <p className="text-lg font-black text-primary">{stats.lambda.toFixed(3)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
