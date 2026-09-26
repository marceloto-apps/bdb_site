'use client'
/** Passo 5 — Staking, banco, limites e opções do run. */
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Estrategia, Staking } from '@/lib/laboratorio/engine/tipos'

export function PainelStaking({ estrategia, onChange }: { estrategia: Estrategia; onChange: (patch: Partial<Estrategia>) => void }) {
  const s = estrategia.staking
  const setStaking = (st: Staking) => onChange({ staking: st })
  const num = (v: string) => (v === '' ? undefined : Number(v))
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Método</Label>
        <select className="bg-background border border-input rounded-md text-sm px-2 h-9 w-full" value={s.metodo} onChange={(e) => {
          const m = e.target.value as Staking['metodo']
          setStaking(m === 'flat' ? { metodo: 'flat', unidade: 1 } : m === 'pct_banco' ? { metodo: 'pct_banco', pct: 0.02 } : m === 'to_win' ? { metodo: 'to_win', alvo: 1 } : { metodo: 'kelly', fracao: 0.25, cap: 0.05, prob: { formula: 'odds.pinnacle.close.1x2.novig_h' } })
          if ((m === 'pct_banco' || m === 'kelly') && !estrategia.bancoInicial) onChange({ bancoInicial: 100 })
        }}>
          <option value="flat">Flat (unidades)</option><option value="pct_banco">% do banco</option><option value="kelly">Kelly fracionário</option><option value="to_win">To-win (lucro alvo)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {s.metodo === 'flat' && <div><Label className="text-[10px]">Unidade</Label><Input type="number" step="0.5" min={0.01} value={s.unidade} onChange={(e) => setStaking({ ...s, unidade: Number(e.target.value) || 1 })} /></div>}
        {s.metodo === 'pct_banco' && <>
          <div><Label className="text-[10px]">% do banco</Label><Input type="number" step="0.5" min={0.1} max={100} value={s.pct * 100} onChange={(e) => setStaking({ ...s, pct: (Number(e.target.value) || 1) / 100 })} /></div>
          <div><Label className="text-[10px]">Stake máx. (opcional)</Label><Input type="number" step="1" value={s.maximo ?? ''} onChange={(e) => setStaking({ ...s, maximo: num(e.target.value) })} /></div>
        </>}
        {s.metodo === 'to_win' && <div><Label className="text-[10px]">Lucro alvo por aposta</Label><Input type="number" step="0.5" min={0.01} value={s.alvo} onChange={(e) => setStaking({ ...s, alvo: Number(e.target.value) || 1 })} /></div>}
        {s.metodo === 'kelly' && <>
          <div><Label className="text-[10px]">Fração de Kelly</Label><Input type="number" step="0.05" min={0.05} max={1} value={s.fracao} onChange={(e) => setStaking({ ...s, fracao: Number(e.target.value) || 0.25 })} /></div>
          <div><Label className="text-[10px]">Cap (% do banco)</Label><Input type="number" step="1" min={0.1} max={100} value={(s.cap ?? 0.05) * 100} onChange={(e) => setStaking({ ...s, cap: (Number(e.target.value) || 5) / 100 })} /></div>
          <div className="col-span-2"><Label className="text-[10px]">Probabilidade (expressão)</Label><Input className="font-mono text-xs" value={s.prob.formula ?? ''} onChange={(e) => setStaking({ ...s, prob: { formula: e.target.value } })} /></div>
        </>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-[10px]">Banco inicial</Label><Input type="number" step="10" min={0} value={estrategia.bancoInicial ?? ''} onChange={(e) => onChange({ bancoInicial: num(e.target.value) })} /></div>
        <div><Label className="text-[10px]">Exposição máx./dia</Label><Input type="number" step="1" min={0} value={estrategia.exposicaoMaxDia ?? ''} onChange={(e) => onChange({ exposicaoMaxDia: num(e.target.value) })} /></div>
        <div><Label className="text-[10px]">Stop drawdown %</Label><Input type="number" step="5" min={1} max={99} value={estrategia.stopDrawdown !== undefined ? estrategia.stopDrawdown * 100 : ''} onChange={(e) => onChange({ stopDrawdown: e.target.value ? Number(e.target.value) / 100 : undefined })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-[10px]">Referência (EV/CLV)</Label>
          <select className="bg-background border border-input rounded-md text-xs px-1 h-9 w-full" value={estrategia.referencia?.casa ?? 'pinnacle'} onChange={(e) => onChange({ referencia: { casa: e.target.value as 'pinnacle' | 'bet365', snapshot: 'close' } })}><option value="pinnacle">Pinnacle fechamento</option><option value="bet365">bet365 fechamento</option></select>
        </div>
        <div><Label className="text-[10px]">Bootstrap (reamostras)</Label><Input type="number" step="100" min={0} max={5000} value={estrategia.bootstrap ?? 1000} onChange={(e) => onChange({ bootstrap: Number(e.target.value) })} /></div>
        <div><Label className="text-[10px]">Semente</Label><Input type="number" step="1" value={estrategia.seed ?? 42} onChange={(e) => onChange({ seed: Number(e.target.value) })} /></div>
      </div>
      <div>
        <Label className="text-[10px]">Parâmetros $p (nome=valor, um por linha)</Label>
        <Input className="font-mono text-xs" placeholder="p1=0.05" value={Object.entries(estrategia.parametros ?? {}).map(([k, v]) => `${k}=${v}`).join('; ')} onChange={(e) => {
          const p: Record<string, number> = {}
          for (const par of e.target.value.split(/[;\n]/)) { const [k, v] = par.split('='); if (k?.trim() && v !== undefined && v.trim() !== '' && !Number.isNaN(Number(v))) p[k.trim()] = Number(v) }
          onChange({ parametros: Object.keys(p).length ? p : undefined })
        }} />
      </div>
    </div>
  )
}
