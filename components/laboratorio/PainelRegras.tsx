'use client'
/** Passo 3 — Regras: builder visual AND/OR ↔ modo fórmula (mesmo AST). */
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import { builderParaFormula, formulaParaBuilder, novaCondicao, OPS_CONDICAO, type Builder, type Condicao, type Operando } from '@/lib/laboratorio/ui/builder'
import { SELECOES } from '@/lib/laboratorio/engine/ast'
import type { Expressao } from '@/lib/laboratorio/engine/tipos'

export function PainelRegras({ regra, onChange, referencias, validacao, nSelecionados, nUniverso }: {
  regra: Expressao | undefined
  onChange: (r: Expressao | undefined) => void
  /** chaves do catálogo + nomes dos indicadores (para os selects do builder) */
  referencias: string[]
  validacao: { ok: boolean; erros: string[]; avisos: string[] } | null
  nSelecionados: number | null
  nUniverso: number | null
}) {
  const formula = regra?.formula ?? ''
  const builderDaFormula = useMemo(() => formulaParaBuilder(formula), [formula])
  const [modo, setModo] = useState<'builder' | 'formula'>(builderDaFormula ? 'builder' : 'formula')
  const [builder, setBuilder] = useState<Builder>(builderDaFormula ?? { combinador: 'and', condicoes: [] })
  useEffect(() => { if (modo === 'builder' && builderDaFormula) setBuilder(builderDaFormula) }, [builderDaFormula, modo])

  const aplicarBuilder = (b: Builder) => { setBuilder(b); const f = builderParaFormula(b); onChange(f ? { formula: f } : undefined) }
  const mudarCond = (id: string, patch: Partial<Condicao>) => aplicarBuilder({ ...builder, condicoes: builder.condicoes.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  const OperandoEditor = ({ v, onChange: set, permitirSel }: { v: Operando; onChange: (o: Operando) => void; permitirSel?: boolean }) => (
    <div className="flex gap-1 min-w-0">
      <select className="bg-background border border-input rounded-md text-xs px-1 shrink-0" value={v.t} onChange={(e) => { const t = e.target.value as Operando['t']; set(t === 'num' ? { t: 'num', v: 0 } : t === 'sel' ? { t: 'sel', v: 'home' } : t === 'str' ? { t: 'str', v: '' } : { t: 'ref', nome: '' }) }}>
        <option value="ref">campo</option><option value="num">número</option>{permitirSel && <option value="sel">seleção</option>}{permitirSel && <option value="str">texto</option>}
      </select>
      {v.t === 'num' && <Input type="number" step="any" className="h-7 text-xs" value={Number.isNaN(v.v) ? '' : v.v} onChange={(e) => set({ t: 'num', v: Number(e.target.value) })} />}
      {v.t === 'str' && <Input className="h-7 text-xs" value={v.v} onChange={(e) => set({ t: 'str', v: e.target.value })} />}
      {v.t === 'sel' && <select className="bg-background border border-input rounded-md text-xs px-1" value={v.v} onChange={(e) => set({ t: 'sel', v: e.target.value as never })}>{SELECOES.map((s) => <option key={s} value={s}>{s}</option>)}</select>}
      {v.t === 'ref' && <Input list="lab-referencias" className="h-7 text-xs font-mono" placeholder="home.l10.xg_for" value={v.nome} onChange={(e) => set({ t: 'ref', nome: e.target.value })} />}
    </div>
  )

  return (
    <div className="space-y-3">
      <datalist id="lab-referencias">{referencias.map((r) => <option key={r} value={r} />)}</datalist>
      <div className="flex items-center gap-2">
        <Button size="sm" variant={modo === 'builder' ? 'default' : 'outline'} onClick={() => { if (builderDaFormula) { setBuilder(builderDaFormula); setModo('builder') } }} disabled={!builderDaFormula} title={builderDaFormula ? '' : 'A fórmula atual usa recursos que o builder não representa (funções, model, parênteses aninhados)'}>Builder</Button>
        <Button size="sm" variant={modo === 'formula' ? 'default' : 'outline'} onClick={() => setModo('formula')}>Fórmula</Button>
        <div className="ml-auto text-xs text-muted-foreground">
          {nSelecionados !== null && nUniverso !== null ? <><Badge variant="secondary">{nSelecionados.toLocaleString('pt-BR')}</Badge> de {nUniverso.toLocaleString('pt-BR')} jogos</> : 'execute para contar'}
        </div>
      </div>

      {modo === 'builder' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Combinar com</span>
            <select className="bg-background border border-input rounded-md text-xs px-1" value={builder.combinador} onChange={(e) => aplicarBuilder({ ...builder, combinador: e.target.value as 'and' | 'or' })}><option value="and">E (and)</option><option value="or">OU (or)</option></select>
          </div>
          {builder.condicoes.map((c) => (
            <div key={c.id} className="border border-border rounded-md p-2 space-y-1">
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-muted-foreground flex items-center gap-1"><input type="checkbox" checked={!!c.negar} onChange={(e) => mudarCond(c.id, { negar: e.target.checked })} />não</label>
                <select className="bg-background border border-input rounded-md text-xs px-1" value={c.op} onChange={(e) => mudarCond(c.id, { op: e.target.value as Condicao['op'] })}>{OPS_CONDICAO.map((o) => <option key={o.v} value={o.v}>{o.rotulo}</option>)}</select>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => aplicarBuilder({ ...builder, condicoes: builder.condicoes.filter((x) => x.id !== c.id) })}><Trash2 className="w-3 h-3" /></Button>
              </div>
              <OperandoEditor v={c.esq} onChange={(o) => mudarCond(c.id, { esq: o })} />
              <OperandoEditor v={c.dir} onChange={(o) => mudarCond(c.id, { dir: o })} permitirSel />
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => aplicarBuilder({ ...builder, condicoes: [...builder.condicoes, novaCondicao()] })}><Plus className="w-3 h-3 mr-1" />Condição</Button>
          {formula && <p className="font-mono text-xs text-muted-foreground break-all">{formula}</p>}
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-xs">Fórmula (vazia = todos os jogos do universo)</Label>
          <Textarea className="font-mono text-xs min-h-[96px]" placeholder={'edge_h > 0.03 and home.l5.pts_pg >= 1.8\nmodel(DC, FORCAS, l10).p_over(2.5) - odds.bet365.close.ou.novig_over_main > $p1'} value={formula} onChange={(e) => onChange(e.target.value.trim() ? { formula: e.target.value } : undefined)} />
        </div>
      )}

      {validacao && !validacao.ok && <ul className="text-xs text-data-red list-disc pl-4">{validacao.erros.map((e, k) => <li key={k}>{e}</li>)}</ul>}
      {validacao?.ok && validacao.avisos.length > 0 && <ul className="text-xs text-data-yellow list-disc pl-4">{validacao.avisos.map((a, k) => <li key={k}>{a}</li>)}</ul>}
      {validacao?.ok && !validacao.avisos.length && formula && <p className="text-xs text-primary">Regra válida.</p>}
    </div>
  )
}
