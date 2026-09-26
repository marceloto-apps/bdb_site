'use client'
/** Modo Explorar — painel esquerdo: cesta de apostas básicas, casas, estatística para cruzar, n mínimo. */
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { CESTA, ESTATISTICAS } from '@/lib/laboratorio/ui/explorador'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import type { Casa } from '@/lib/laboratorio/engine/tipos'
import { Dica, Rotulo } from './Dica'

export interface ConfigExplorar {
  apostas: string[]
  casas: Casa[]
  estatistica: string | null
  formulaLivre: string
  cortes: 'tercis' | 'quartis'
  nMin: number
}

export function PainelExplorar({ cfg, onChange, referencias }: { cfg: ConfigExplorar; onChange: (c: ConfigExplorar) => void; referencias: string[] }) {
  const set = (patch: Partial<ConfigExplorar>) => onChange({ ...cfg, ...patch })
  const grupos = Array.from(new Set(CESTA.map((c) => c.grupo)))
  const toggle = (id: string) => set({ apostas: cfg.apostas.includes(id) ? cfg.apostas.filter((x) => x !== id) : [...cfg.apostas, id] })
  const toggleCasa = (c: Casa) => set({ casas: cfg.casas.includes(c) ? cfg.casas.filter((x) => x !== c) : [...cfg.casas, c] })
  const gruposEst = Array.from(new Set(ESTATISTICAS.map((e) => e.grupo)))
  const est = ESTATISTICAS.find((e) => e.id === cfg.estatistica)
  return (
    <div className="space-y-4">
      <div>
        <Rotulo className="text-sm" dica={DICAS.cesta}>Apostas a testar em todos os jogos</Rotulo>
        <div className="mt-1 space-y-2">
          {grupos.map((g) => (
            <div key={g}>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{g}</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                {CESTA.filter((c) => c.grupo === g).map((c) => <label key={c.id} className="flex items-center gap-2 text-sm"><Checkbox checked={cfg.apostas.includes(c.id)} onCheckedChange={() => toggle(c.id)} />{c.nome}</label>)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-sm">
          <label className="flex items-center gap-2"><Switch checked={cfg.casas.includes('bet365')} onCheckedChange={() => toggleCasa('bet365')} />bet365</label>
          <label className="flex items-center gap-2"><Switch checked={cfg.casas.includes('pinnacle')} onCheckedChange={() => toggleCasa('pinnacle')} />Pinnacle</label>
          <Dica texto="Odds de fechamento. A Pinnacle não tem handicap/gols em todas as ligas; onde falta, a célula fica vazia." />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{cfg.apostas.length * cfg.casas.length} apostas na cesta</p>
      </div>

      <div>
        <Rotulo className="text-sm" dica={DICAS.cruzamento}>Cruzar com uma estatística (opcional)</Rotulo>
        <select className="bg-background border border-input rounded-md text-sm px-2 h-9 w-full mt-1" value={cfg.estatistica ?? ''} onChange={(e) => set({ estatistica: e.target.value || null })}>
          <option value="">— nenhuma: só liga × aposta —</option>
          {gruposEst.map((g) => <optgroup key={g} label={g}>{ESTATISTICAS.filter((e) => e.grupo === g).map((e) => <option key={e.id} value={e.id}>{e.rotulo}</option>)}</optgroup>)}
          <option value="livre">Outra (escrever a fórmula)</option>
        </select>
        {est && <p className="text-xs text-muted-foreground mt-1">{est.descricao}</p>}
        {cfg.estatistica === 'livre' && <>
          <datalist id="lab-referencias-exp">{referencias.map((r) => <option key={r} value={r} />)}</datalist>
          <Input list="lab-referencias-exp" className="font-mono text-xs h-8 mt-1" placeholder="ex.: home.l10.xg_for - home.l10.gf" value={cfg.formulaLivre} onChange={(e) => set({ formulaLivre: e.target.value })} />
        </>}
        {cfg.estatistica && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-muted-foreground">Dividir em</span>
            <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={cfg.cortes} onChange={(e) => set({ cortes: e.target.value as 'tercis' | 'quartis' })}><option value="tercis">3 faixas (baixo, médio, alto)</option><option value="quartis">4 faixas (quartos)</option></select>
            <Dica texto="As faixas são calculadas sobre os jogos do universo: cada uma tem o mesmo número de jogos. Estatísticas sim/não viram duas faixas." />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div><Rotulo dica={DICAS.nMin}>Mínimo de apostas por célula</Rotulo><Input type="number" min={10} step={10} className="h-8 text-xs" value={cfg.nMin} onChange={(e) => set({ nMin: Math.max(10, Number(e.target.value) || 100) })} /></div>
      </div>
    </div>
  )
}
