'use client'
/** Passo 4 — Apostas (entradas): mercado, seleção, linha, preço de decisão/liquidação, condição, filtros. */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { SELECOES_POR_MERCADO, COM_LINHA, casaTemMercado } from '@/lib/laboratorio/engine/entradas'
import { DICAS, ROTULO_CASA, ROTULO_MERCADO, ROTULO_SNAPSHOT, rotuloSelecao } from '@/lib/laboratorio/ui/rotulos'
import type { Casa, Entrada, Mercado, Snapshot } from '@/lib/laboratorio/engine/tipos'
import { Dica, Rotulo } from './Dica'

const MERCADOS = Object.entries(ROTULO_MERCADO) as [Mercado, string][]
const LINHAS_FIXAS: Partial<Record<Mercado, number[]>> = { ou: [0.5, 1.5, 2.5, 3.5, 4.5], ht_ou: [0.5, 1.5, 2.5], eh: [-3, -2, -1, 1, 2, 3] }

const nova = (n: number): Entrada => ({ id: `e${n}`, mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } })

export function PainelEntradas({ entradas, onChange }: { entradas: Entrada[]; onChange: (e: Entrada[]) => void }) {
  const mudar = (k: number, patch: Partial<Entrada>) => onChange(entradas.map((e, j) => (j === k ? { ...e, ...patch } : e)))
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1">O que apostar em cada jogo selecionado<Dica texto={DICAS.aposta} /></p>
      {entradas.map((e, k) => {
        const selExpr = typeof e.selecao !== 'string'
        const linhaExpr = typeof e.linha === 'object'
        const precisaLinha = COM_LINHA.includes(e.mercado)
        return (
          <div key={k} className="border border-border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Aposta</span>
              <Input className="h-7 w-16 text-xs font-mono" title={DICAS.idAposta} value={e.id ?? `e${k + 1}`} onChange={(ev) => mudar(k, { id: ev.target.value })} />
              <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1 min-w-0" value={e.mercado} onChange={(ev) => { const m = ev.target.value as Mercado; const casa: Casa = casaTemMercado(e.preco.casa, e.preco.snapshot, m) ? e.preco.casa : 'bet365'; const snapshot: Snapshot = casaTemMercado(casa, e.preco.snapshot, m) ? e.preco.snapshot : 'close'; mudar(k, { mercado: m, selecao: SELECOES_POR_MERCADO[m][0] as Entrada['selecao'], linha: COM_LINHA.includes(m) ? (m === 'eh' ? -1 : 'main') : undefined, preco: { casa, snapshot }, liquidacao: undefined }) }}>
                {MERCADOS.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Remover aposta" disabled={entradas.length <= 1} onClick={() => onChange(entradas.filter((_, j) => j !== k))}><Trash2 className="w-3 h-3" /></Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Rotulo dica={DICAS.selecao}>Lado</Rotulo>
                <div className="flex gap-1">
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7 shrink-0" value={selExpr ? 'expr' : 'fixa'} onChange={(ev) => mudar(k, { selecao: (ev.target.value === 'expr' ? { formula: 'if(edge_h >= edge_a, home, away)' } : SELECOES_POR_MERCADO[e.mercado][0]) as Entrada['selecao'] })}><option value="fixa">fixo</option><option value="expr">expressão</option></select>
                  {selExpr ? <Input className="h-7 text-xs font-mono" value={(e.selecao as { formula?: string }).formula ?? ''} onChange={(ev) => mudar(k, { selecao: { formula: ev.target.value } })} />
                    : <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1 min-w-0" value={e.selecao as string} onChange={(ev) => mudar(k, { selecao: ev.target.value as Entrada['selecao'] })}>{SELECOES_POR_MERCADO[e.mercado].map((s) => <option key={s} value={s}>{rotuloSelecao(s)}</option>)}</select>}
                </div>
              </div>
              {precisaLinha && (
                <div>
                  <Rotulo dica={DICAS.linha}>Linha</Rotulo>
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
                <Rotulo dica={DICAS.precoDecisao}>Odd para decidir</Rotulo>
                <div className="flex gap-1">
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1 min-w-0" value={e.preco.casa} onChange={(ev) => mudar(k, { preco: { ...e.preco, casa: ev.target.value as Casa } })}>
                    {(['bet365', 'pinnacle'] as Casa[]).filter((c) => casaTemMercado(c, e.preco.snapshot, e.mercado)).map((c) => <option key={c} value={c}>{ROTULO_CASA[c]}</option>)}
                  </select>
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={e.preco.snapshot} onChange={(ev) => mudar(k, { preco: { ...e.preco, snapshot: ev.target.value as Snapshot } })}>
                    {(['open', 'close'] as Snapshot[]).filter((s) => casaTemMercado(e.preco.casa, s, e.mercado)).map((s) => <option key={s} value={s}>{ROTULO_SNAPSHOT[s]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Rotulo dica={DICAS.liquidacao}>Odd para pagar</Rotulo>
                <div className="flex gap-1">
                  <select className="bg-background border border-input rounded-md text-xs px-1 h-7 flex-1 min-w-0" value={e.liquidacao ? `${e.liquidacao.casa}.${e.liquidacao.snapshot}` : ''} onChange={(ev) => { const v = ev.target.value; if (!v) mudar(k, { liquidacao: undefined }); else { const [casa, snapshot] = v.split('.') as [Casa, Snapshot]; mudar(k, { liquidacao: { casa, snapshot } }) } }}>
                    <option value="">a mesma odd</option>
                    {(['bet365', 'pinnacle'] as Casa[]).flatMap((c) => (['open', 'close'] as Snapshot[]).filter((s) => casaTemMercado(c, s, e.mercado)).map((s) => <option key={`${c}.${s}`} value={`${c}.${s}`}>{ROTULO_CASA[c]} {ROTULO_SNAPSHOT[s]}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div><Rotulo dica={DICAS.oddMinMax}>Odd mín.</Rotulo><Input type="number" step="0.01" className="h-7 text-xs" value={e.oddMin ?? ''} onChange={(ev) => mudar(k, { oddMin: ev.target.value ? Number(ev.target.value) : undefined })} /></div>
              <div><Rotulo>Odd máx.</Rotulo><Input type="number" step="0.01" className="h-7 text-xs" value={e.oddMax ?? ''} onChange={(ev) => mudar(k, { oddMax: ev.target.value ? Number(ev.target.value) : undefined })} /></div>
              <div><Rotulo dica={DICAS.slippage}>Perda de odd %</Rotulo><Input type="number" step="0.5" min={0} max={50} className="h-7 text-xs" value={e.slippage !== undefined ? e.slippage * 100 : ''} onChange={(ev) => mudar(k, { slippage: ev.target.value ? Number(ev.target.value) / 100 : undefined })} /></div>
              <div><Rotulo dica={DICAS.stakeMult}>× stake</Rotulo><Input type="number" step="0.5" min={0.1} className="h-7 text-xs" value={e.stakeMult ?? 1} onChange={(ev) => mudar(k, { stakeMult: Number(ev.target.value) || 1 })} /></div>
            </div>
            <div>
              <Rotulo dica={DICAS.condicaoExtra}>Condição extra só desta aposta (opcional)</Rotulo>
              <Input className="h-7 text-xs font-mono" placeholder="ex.: match.round > 5" value={e.condicao?.formula ?? ''} onChange={(ev) => mudar(k, { condicao: ev.target.value.trim() ? { formula: ev.target.value } : undefined })} />
            </div>
          </div>
        )
      })}
      <Button size="sm" variant="secondary" disabled={entradas.length >= 10} onClick={() => onChange([...entradas, nova(entradas.length + 1)])}><Plus className="w-3 h-3 mr-1" />Outra aposta no mesmo jogo</Button>
    </div>
  )
}
