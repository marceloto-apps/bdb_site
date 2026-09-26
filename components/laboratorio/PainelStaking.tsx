'use client'
/** Passo 5 — Stake, banco, limites e opções do run. */
import { Input } from '@/components/ui/input'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import type { Estrategia, Staking } from '@/lib/laboratorio/engine/tipos'
import { Rotulo } from './Dica'

const DICA_METODO: Record<Staking['metodo'], string> = { flat: DICAS.flat, pct_banco: DICAS.pctBanco, kelly: DICAS.kelly, to_win: DICAS.toWin }

export function PainelStaking({ estrategia, onChange }: { estrategia: Estrategia; onChange: (patch: Partial<Estrategia>) => void }) {
  const s = estrategia.staking
  const setStaking = (st: Staking) => onChange({ staking: st })
  const num = (v: string) => (v === '' ? undefined : Number(v))
  return (
    <div className="space-y-3">
      <div>
        <Rotulo className="text-xs" dica={DICA_METODO[s.metodo]}>Como definir o stake</Rotulo>
        <select className="bg-background border border-input rounded-md text-sm px-2 h-9 w-full" value={s.metodo} onChange={(e) => {
          const m = e.target.value as Staking['metodo']
          setStaking(m === 'flat' ? { metodo: 'flat', unidade: 1 } : m === 'pct_banco' ? { metodo: 'pct_banco', pct: 0.02 } : m === 'to_win' ? { metodo: 'to_win', alvo: 1 } : { metodo: 'kelly', fracao: 0.25, cap: 0.05, prob: { formula: 'odds.pinnacle.close.1x2.novig_h' } })
          if ((m === 'pct_banco' || m === 'kelly') && !estrategia.bancoInicial) onChange({ bancoInicial: 100 })
        }}>
          <option value="flat">Fixo (mesmas unidades em toda aposta)</option><option value="pct_banco">Percentual do banco</option><option value="kelly">Kelly fracionário</option><option value="to_win">Lucro alvo (to-win)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {s.metodo === 'flat' && <div><Rotulo>Unidades por aposta</Rotulo><Input type="number" step="0.5" min={0.01} value={s.unidade} onChange={(e) => setStaking({ ...s, unidade: Number(e.target.value) || 1 })} /></div>}
        {s.metodo === 'pct_banco' && <>
          <div><Rotulo>% do banco por aposta</Rotulo><Input type="number" step="0.5" min={0.1} max={100} value={s.pct * 100} onChange={(e) => setStaking({ ...s, pct: (Number(e.target.value) || 1) / 100 })} /></div>
          <div><Rotulo>Stake máximo (opcional)</Rotulo><Input type="number" step="1" value={s.maximo ?? ''} onChange={(e) => setStaking({ ...s, maximo: num(e.target.value) })} /></div>
        </>}
        {s.metodo === 'to_win' && <div><Rotulo>Lucro alvo por aposta</Rotulo><Input type="number" step="0.5" min={0.01} value={s.alvo} onChange={(e) => setStaking({ ...s, alvo: Number(e.target.value) || 1 })} /></div>}
        {s.metodo === 'kelly' && <>
          <div><Rotulo dica="1 = Kelly cheio; 0,25 = um quarto (mais conservador).">Fração de Kelly</Rotulo><Input type="number" step="0.05" min={0.05} max={1} value={s.fracao} onChange={(e) => setStaking({ ...s, fracao: Number(e.target.value) || 0.25 })} /></div>
          <div><Rotulo dica="Teto do stake como % do banco, mesmo que o Kelly peça mais.">Teto (% do banco)</Rotulo><Input type="number" step="1" min={0.1} max={100} value={(s.cap ?? 0.05) * 100} onChange={(e) => setStaking({ ...s, cap: (Number(e.target.value) || 5) / 100 })} /></div>
          <div className="col-span-2"><Rotulo dica="Probabilidade que você acredita ser a verdadeira para a aposta. Ex.: a probabilidade justa da Pinnacle ou a saída de um modelo.">Probabilidade estimada (expressão)</Rotulo><Input className="font-mono text-xs" value={s.prob.formula ?? ''} onChange={(e) => setStaking({ ...s, prob: { formula: e.target.value } })} /></div>
        </>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><Rotulo dica={DICAS.banco}>Banco inicial</Rotulo><Input type="number" step="10" min={0} value={estrategia.bancoInicial ?? ''} onChange={(e) => onChange({ bancoInicial: num(e.target.value) })} /></div>
        <div><Rotulo dica={DICAS.exposicao}>Máx. em jogo por dia</Rotulo><Input type="number" step="1" min={0} value={estrategia.exposicaoMaxDia ?? ''} onChange={(e) => onChange({ exposicaoMaxDia: num(e.target.value) })} /></div>
        <div><Rotulo dica={DICAS.stopDrawdown}>Parar se cair %</Rotulo><Input type="number" step="5" min={1} max={99} value={estrategia.stopDrawdown !== undefined ? estrategia.stopDrawdown * 100 : ''} onChange={(e) => onChange({ stopDrawdown: e.target.value ? Number(e.target.value) / 100 : undefined })} /></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Rotulo dica={DICAS.referencia}>Odd de referência</Rotulo>
          <select className="bg-background border border-input rounded-md text-xs px-1 h-9 w-full" value={estrategia.referencia?.casa ?? 'pinnacle'} onChange={(e) => onChange({ referencia: { casa: e.target.value as 'pinnacle' | 'bet365', snapshot: 'close' } })}><option value="pinnacle">Pinnacle fechamento</option><option value="bet365">bet365 fechamento</option></select>
        </div>
        <div><Rotulo dica={DICAS.bootstrap}>Reamostras</Rotulo><Input type="number" step="100" min={0} max={5000} value={estrategia.bootstrap ?? 1000} onChange={(e) => onChange({ bootstrap: Number(e.target.value) })} /></div>
        <div><Rotulo dica={DICAS.semente}>Semente</Rotulo><Input type="number" step="1" value={estrategia.seed ?? 42} onChange={(e) => onChange({ seed: Number(e.target.value) })} /></div>
      </div>
      <div>
        <Rotulo dica={DICAS.parametros}>Parâmetros das fórmulas ($nome)</Rotulo>
        <Input className="font-mono text-xs" placeholder="p1=0.05; p2=1.8" value={Object.entries(estrategia.parametros ?? {}).map(([k, v]) => `${k}=${v}`).join('; ')} onChange={(e) => {
          const p: Record<string, number> = {}
          for (const par of e.target.value.split(/[;\n]/)) { const [k, v] = par.split('='); if (k?.trim() && v !== undefined && v.trim() !== '' && !Number.isNaN(Number(v))) p[k.trim()] = Number(v) }
          onChange({ parametros: Object.keys(p).length ? p : undefined })
        }} />
      </div>
    </div>
  )
}
