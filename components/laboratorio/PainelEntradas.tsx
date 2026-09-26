'use client'
/** Passo 4 — Entradas (pernas): mercado, seleção, linha, preço de decisão/liquidação, condição, filtros. */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { SELECOES_POR_MERCADO, COM_LINHA, casaTemMercado } from '@/lib/laboratorio/engine/entradas'
import type { Casa, Entrada, Mercado, Snapshot } from '@/lib/laboratorio/engine/tipos'

const MERCADOS: { v: Mercado; rotulo: string }[] = [
  { v: '1x2', rotulo: '1X2' }, { v: 'btts', rotulo: 'Ambas marcam' }, { v: 'ou', rotulo: 'Over/Under gols' }, { v: 'ah', rotulo: 'Handicap asiático' }, { v: 'corners', rotulo: 'Escanteios O/U' },
  { v: 'ht_1x2', rotulo: '1º tempo 1X2' }, { v: 'ht_ou', rotulo: '1º tempo O/U' }, { v: 'ht_ah', rotulo: '1º tempo AH' }, { v: 'dc', rotulo: 'Dupla chance' }, { v: 'eh', rotulo: 'Handicap europeu' }, { v: 'cs', rotulo: 'Placar exato' },
]
const LINHAS_FIXAS: Partial<Record<Mercado, number[]>> = { ou: [0.5, 1.5, 2.5, 3.5, 4.5], ht_ou: [0.5, 1.5, 2.5], eh: [-3, -2, -1, 1, 2, 3] }

const nova = (): Entrada => ({ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } })

export function PainelEntradas({ entradas, onChange }: { entradas: Entrada[]; onChange: (e: Entrada[]) => void }) {
  const mudar = (k: number, patch: Partial<Entrada>) => onChange(entradas.map((e, j) => (j === k ? { ...e, ...patch } : e)))
  return (
    <div className="space-y-3">
      {entradas.map((e, k) => {
        const selExpr = typeof e.selecao !== 'string'
        const linhaExpr = typeof e.linha === 'object'
        const precisaLinha = COM_LINHA.includes(e.mercado)
        return (
          <div key={k} className="border border-border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input className="h-7 w-20 text-xs font-mono" value={e.id ?? `e${k + 1}`} onChange={(ev) => mudar(k, { id: ev.target.value })} />
              <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1" value={e.mercado} onChange={(ev) => { const m = ev.target.value as Mercado; const casa: Casa = casaTemMercado(e.preco.casa, e.preco.snapshot, m) ? e.preco.casa : 'bet365'; const snapshot: Snapshot = casaTemMercado(casa, e.preco.snapshot, m) ? e.preco.snapshot : 'close'; mudar(k, { mercado: m, selecao: SELECOES_POR_MERCADO[m][0] as Entrada['selecao'], linha: COM_LINHA.includes(m) ? (m === 'eh' ? -1 : 'main') : undefined, preco: { casa, snapshot }, liquidacao: undefined }) }}>
                {MERCADOS.map((m) => <option key={m.v} value={m.v}>{m.rotulo}</option>)}
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={entradas.length <= 1} onClick={() => onChange(entradas.filter((_, j) => j !== k))}><Trash2 className="w-3 h-3" /></Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Seleção</Label>
                <div className="flex gap-1">
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7 shrink-0" value={selExpr ? 'expr' : 'fixa'} onChange={(ev) => mudar(k, { selecao: (ev.target.value === 'expr' ? { formula: 'if(edge_h >= edge_a, home, away)' } : SELECOES_POR_MERCADO[e.mercado][0]) as Entrada['selecao'] })}><option value="fixa">fixa</option><option value="expr">expressão</option></select>
                  {selExpr ? <Input className="h-7 text-xs font-mono" value={(e.selecao as { formula?: string }).formula ?? ''} onChange={(ev) => mudar(k, { selecao: { formula: ev.target.value } })} />
                    : <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1" value={e.selecao as string} onChange={(ev) => mudar(k, { selecao: ev.target.value as Entrada['selecao'] })}>{SELECOES_POR_MERCADO[e.mercado].map((s) => <option key={s} value={s}>{s}</option>)}</select>}
                </div>
              </div>
              {precisaLinha && (
                <div>
                  <Label className="text-[10px]">Linha</Label>
                  <div className="flex gap-1">
                    <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={linhaExpr ? 'expr' : e.linha === 'main' || e.linha === undefined ? 'main' : 'fixa'} onChange={(ev) => { const v = ev.target.value; mudar(k, { linha: v === 'main' ? 'main' : v === 'expr' ? { formula: 'quarter(model(POISSON, MEDIA, l10).lambda_h + model(POISSON, MEDIA, l10).lambda_a)' } : (LINHAS_FIXAS[e.mercado]?.[0] ?? 0) }) }}>
                      {e.mercado !== 'eh' && <option value="main">principal</option>}<option value="fixa">fixa</option>{e.mercado !== 'eh' && <option value="expr">expressão</option>}
                    </select>
                    {linhaExpr && <Input className="h-7 text-xs font-mono" value={(e.linha as { formula?: string }).formula ?? ''} onChange={(ev) => mudar(k, { linha: { formula: ev.target.value } })} />}
                    {typeof e.linha === 'number' && (LINHAS_FIXAS[e.mercado]
                      ? <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={e.linha} onChange={(ev) => mudar(k, { linha: Number(ev.target.value) })}>{LINHAS_FIXAS[e.mercado]!.map((l) => <option key={l} value={l}>{l > 0 && e.mercado === 'eh' ? `+${l}` : l}</option>)}</select>
                      : <Input type="number" step="0.25" className="h-7 text-xs" value={e.linha} onChange={(ev) => mudar(k, { linha: Number(ev.target.value) })} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Preço de decisão</Label>
                <div className="flex gap-1">
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1" value={e.preco.casa} onChange={(ev) => mudar(k, { preco: { ...e.preco, casa: ev.target.value as Casa } })}>
                    {(['bet365', 'pinnacle'] as Casa[]).filter((c) => casaTemMercado(c, e.preco.snapshot, e.mercado)).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={e.preco.snapshot} onChange={(ev) => mudar(k, { preco: { ...e.preco, snapshot: ev.target.value as Snapshot } })}>
                    {(['open', 'close'] as Snapshot[]).filter((s) => casaTemMercado(e.preco.casa, s, e.mercado)).map((s) => <option key={s} value={s}>{s === 'open' ? 'abertura' : 'fechamento'}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-[10px]">Liquidação</Label>
                <div className="flex gap-1">
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1" value={e.liquidacao ? `${e.liquidacao.casa}.${e.liquidacao.snapshot}` : ''} onChange={(ev) => { const v = ev.target.value; if (!v) mudar(k, { liquidacao: undefined }); else { const [casa, snapshot] = v.split('.') as [Casa, Snapshot]; mudar(k, { liquidacao: { casa, snapshot } }) } }}>
                    <option value="">mesmo preço</option>
                    {(['bet365', 'pinnacle'] as Casa[]).flatMap((c) => (['open', 'close'] as Snapshot[]).filter((s) => casaTemMercado(c, s, e.mercado)).map((s) => <option key={`${c}.${s}`} value={`${c}.${s}`}>{c} {s === 'open' ? 'abertura' : 'fechamento'}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div><Label className="text-[10px]">Odd mín.</Label><Input type="number" step="0.01" className="h-7 text-xs" value={e.oddMin ?? ''} onChange={(ev) => mudar(k, { oddMin: ev.target.value ? Number(ev.target.value) : undefined })} /></div>
              <div><Label className="text-[10px]">Odd máx.</Label><Input type="number" step="0.01" className="h-7 text-xs" value={e.oddMax ?? ''} onChange={(ev) => mudar(k, { oddMax: ev.target.value ? Number(ev.target.value) : undefined })} /></div>
              <div><Label className="text-[10px]">Slippage %</Label><Input type="number" step="0.5" min={0} max={50} className="h-7 text-xs" value={e.slippage !== undefined ? e.slippage * 100 : ''} onChange={(ev) => mudar(k, { slippage: ev.target.value ? Number(ev.target.value) / 100 : undefined })} /></div>
              <div><Label className="text-[10px]">× stake</Label><Input type="number" step="0.5" min={0.1} className="h-7 text-xs" value={e.stakeMult ?? 1} onChange={(ev) => mudar(k, { stakeMult: Number(ev.target.value) || 1 })} /></div>
            </div>
            <div>
              <Label className="text-[10px]">Condição extra desta perna (opcional)</Label>
              <Input className="h-7 text-xs font-mono" placeholder="ex.: match.round > 5" value={e.condicao?.formula ?? ''} onChange={(ev) => mudar(k, { condicao: ev.target.value.trim() ? { formula: ev.target.value } : undefined })} />
            </div>
          </div>
        )
      })}
      <Button size="sm" variant="secondary" disabled={entradas.length >= 10} onClick={() => onChange([...entradas, nova()])}><Plus className="w-3 h-3 mr-1" />Perna</Button>
    </div>
  )
}
