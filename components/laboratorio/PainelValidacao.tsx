'use client'
/** Passo 6 — Validação avançada: holdout selado, folds, walk-forward, varredura de $p, Monte Carlo, calibração. */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Lock, Unlock } from 'lucide-react'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import type { Estrategia, Validacao } from '@/lib/laboratorio/engine/tipos'
import { Dica, Rotulo } from './Dica'

export function PainelValidacao({ estrategia, onChange, seloAbertoNoServidor, podeAbrirSelo, onAbrirSelo, nSalvas }: {
  estrategia: Estrategia
  onChange: (patch: Partial<Estrategia>) => void
  /** a estratégia salva já teve o selo aberto (não volta a fechar) */
  seloAbertoNoServidor: boolean
  /** há estratégia salva (o selo só abre para estratégias salvas) */
  podeAbrirSelo: boolean
  onAbrirSelo: () => void
  nSalvas: number
}) {
  const v: Validacao = estrategia.validacao ?? {}
  const set = (patch: Partial<Validacao>) => onChange({ validacao: { ...v, ...patch } })
  const params = Object.keys(estrategia.parametros ?? {})
  const holdout = v.holdout ?? 'aberto'
  const num = (x: string) => (x === '' ? undefined : Number(x))
  void nSalvas
  return (
    <div className="space-y-4">
      <div className={`rounded-md border p-3 space-y-2 ${holdout === 'selado' ? 'border-primary/50 bg-primary/5' : 'border-data-yellow/50 bg-data-yellow/5'}`}>
        <div className="flex items-center gap-2 text-sm">
          {holdout === 'selado' ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-data-yellow" />}
          <b>{holdout === 'selado' ? 'Última temporada selada' : 'Última temporada aberta'}</b>
          <Dica texto={DICAS.holdout} />
        </div>
        <p className="text-xs text-muted-foreground">
          {holdout === 'selado'
            ? 'A temporada mais recente de cada liga fica de fora enquanto você ajusta a estratégia. Abra o selo só quando terminar: é o seu teste final, sem contaminação.'
            : seloAbertoNoServidor ? 'O selo desta estratégia já foi aberto: a última temporada entra no run e aparece separada na aba Validação.' : 'A última temporada entra no run. Para um teste honesto, sele-a enquanto ajusta a regra.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {holdout === 'selado'
            ? <Button size="sm" variant="outline" disabled={!podeAbrirSelo} title={podeAbrirSelo ? 'Registra na estratégia salva que o selo foi aberto' : 'Salve a estratégia (passo 7) para abrir o selo'} onClick={onAbrirSelo}><Unlock className="w-3 h-3 mr-1" />Abrir o selo</Button>
            : !seloAbertoNoServidor && <Button size="sm" variant="outline" onClick={() => set({ holdout: 'selado' })}><Lock className="w-3 h-3 mr-1" />Selar a última temporada</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Rotulo dica={DICAS.folds}>Cortes no tempo</Rotulo>
          <select className="bg-background border border-input rounded-md text-xs px-1 h-8 w-full" value={v.folds ?? 'temporada'} onChange={(e) => set({ folds: e.target.value as 'temporada' | 'ano' })}><option value="temporada">por temporada</option><option value="ano">por ano</option></select>
        </div>
        <div>
          <Rotulo dica={DICAS.walkForward}>Walk-forward (janelas)</Rotulo>
          <div className="flex items-center gap-2">
            <Input type="number" min={2} max={8} step={1} className="h-8 text-xs" value={v.walkForward?.janelas ?? 4} onChange={(e) => set({ walkForward: { janelas: Math.min(8, Math.max(2, Number(e.target.value) || 4)), expandindo: v.walkForward?.expandindo } })} />
            <label className="flex items-center gap-1 text-[10px] whitespace-nowrap" title="Treino cresce a cada janela (expansivo) ou usa só a janela anterior"><Switch className="scale-75" checked={v.walkForward?.expandindo !== false} onCheckedChange={(on) => set({ walkForward: { janelas: v.walkForward?.janelas ?? 4, expandindo: on } })} />expansivo</label>
          </div>
        </div>
      </div>

      <div>
        <Rotulo dica={DICAS.varredura}>Varredura dos parâmetros $p</Rotulo>
        {params.length === 0 && <p className="text-xs text-muted-foreground">Defina parâmetros no passo 5 (ex.: p1=0.05) e use $p1 na regra para varrer faixas aqui.</p>}
        {params.map((p) => {
          const f = v.varredura?.[p]
          const on = !!f
          const setF = (patch: Partial<{ de: number; ate: number; passo: number }>) => { const atual = v.varredura ?? {}; set({ varredura: { ...atual, [p]: { de: f?.de ?? 0, ate: f?.ate ?? 0, passo: f?.passo ?? 0.01, ...patch } } }) }
          return (
            <div key={p} className="flex items-center gap-2 text-xs mt-1">
              <label className="flex items-center gap-1 w-16 shrink-0"><Switch className="scale-75" checked={on} onCheckedChange={(x) => { if (x) { const base = estrategia.parametros?.[p] ?? 0; const passo = Math.abs(base) >= 1 ? 0.1 : 0.01; set({ varredura: { ...(v.varredura ?? {}), [p]: { de: Math.round((base - 5 * passo) * 1e6) / 1e6, ate: Math.round((base + 5 * passo) * 1e6) / 1e6, passo } } }) } else { const atual = { ...(v.varredura ?? {}) }; delete atual[p]; set({ varredura: Object.keys(atual).length ? atual : undefined }) } }} /><span className="font-mono">${p}</span></label>
              {on && <>
                <span className="text-muted-foreground">de</span><Input type="number" step="any" className="h-7 text-xs" value={f.de} onChange={(e) => setF({ de: Number(e.target.value) })} />
                <span className="text-muted-foreground">até</span><Input type="number" step="any" className="h-7 text-xs" value={f.ate} onChange={(e) => setF({ ate: Number(e.target.value) })} />
                <span className="text-muted-foreground">passo</span><Input type="number" step="any" className="h-7 text-xs" value={f.passo} onChange={(e) => setF({ passo: Number(e.target.value) })} />
              </>}
            </div>
          )
        })}
        {v.varredura && Object.keys(v.varredura).length > 0 && <p className="text-[10px] text-muted-foreground mt-1">{combinacoes(v.varredura).toLocaleString('pt-BR')} combinações (máx. 200); cada uma conta como uma tentativa na deflação.</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><Rotulo dica={DICAS.monteCarlo}>Monte Carlo (caminhos)</Rotulo><Input type="number" min={100} max={10000} step={100} className="h-8 text-xs" value={v.monteCarlo?.caminhos ?? 2000} onChange={(e) => set({ monteCarlo: { ...v.monteCarlo, caminhos: Number(e.target.value) || 2000 } })} /></div>
        <div><Rotulo dica={DICAS.ruina}>Ruína = queda de %</Rotulo><Input type="number" min={5} max={100} step={5} className="h-8 text-xs" value={Math.round((v.monteCarlo?.ruinaPct ?? 0.5) * 100)} onChange={(e) => set({ monteCarlo: { ...v.monteCarlo, ruinaPct: (num(e.target.value) ?? 50) / 100 } })} /></div>
      </div>

      <div>
        <Rotulo dica={DICAS.calibracao}>Calibração: probabilidade estimada (expressão)</Rotulo>
        <Input className="font-mono text-xs h-8" placeholder={estrategia.staking.metodo === 'kelly' ? 'vazio = usa a probabilidade do Kelly' : 'ex.: model(DC, FORCAS, l10).p_h'} value={v.calibracao?.prob.formula ?? ''} onChange={(e) => set({ calibracao: e.target.value.trim() ? { prob: { formula: e.target.value } } : undefined })} />
      </div>
    </div>
  )
}

export function combinacoes(varredura: NonNullable<Validacao['varredura']>): number {
  let n = 1
  for (const f of Object.values(varredura)) { if (f.passo > 0 && f.ate >= f.de) n *= Math.floor((f.ate - f.de) / f.passo + 1e-9) + 1 }
  return n
}
