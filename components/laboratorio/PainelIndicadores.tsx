'use client'
/** Passo 2 — Indicadores: catálogo pesquisável + "meus indicadores" (da estratégia e salvos no servidor). */
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Copy, Plus, Save, Trash2 } from 'lucide-react'
import { DICAS, ROTULO_BLOCO, rotuloTipo } from '@/lib/laboratorio/ui/rotulos'
import type { CampoUI, FuncaoUI, IndicadorSalvoUI } from '@/lib/laboratorio/ui/tipos'
import { Rotulo } from './Dica'

interface Indicador { nome: string; expressao: { formula?: string; ast?: unknown } }

export function PainelIndicadores({ indicadores, onChange, catalogo, funcoes, salvos, onSalvarServidor, tiposIndicadores, errosIndicadores }: {
  indicadores: Indicador[]
  onChange: (i: Indicador[]) => void
  catalogo: CampoUI[]
  funcoes: FuncaoUI[]
  salvos: IndicadorSalvoUI[]
  onSalvarServidor: (nome: string, formula: string) => Promise<void>
  tiposIndicadores: Record<string, string>
  errosIndicadores: string[]
}) {
  const { toast } = useToast()
  const [busca, setBusca] = useState('')
  const [bloco, setBloco] = useState<string>('')
  const [novoNome, setNovoNome] = useState('')
  const [novaFormula, setNovaFormula] = useState('')

  const campos = useMemo(() => {
    const q = busca.toLowerCase().trim()
    return catalogo.filter((c) => (!bloco || c.bloco === bloco) && (!q || c.key.toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q))).slice(0, 60)
  }, [catalogo, busca, bloco])
  const copiar = async (t: string) => { try { await navigator.clipboard.writeText(t); toast({ title: 'Nome copiado', description: t }) } catch { /* sem clipboard */ } }
  const adicionar = () => {
    const nome = novoNome.trim(), formula = novaFormula.trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(nome)) { toast({ title: 'Nome inválido', description: 'Use letras, números e _ (ex.: edge_h)', variant: 'destructive' }); return }
    if (!formula) return
    if (indicadores.some((i) => i.nome === nome)) { toast({ title: 'Já existe um indicador com esse nome', variant: 'destructive' }); return }
    onChange([...indicadores, { nome, expressao: { formula } }])
    setNovoNome(''); setNovaFormula('')
  }
  const usarSalvo = (s: IndicadorSalvoUI) => { if (indicadores.some((i) => i.nome === s.nome)) return; onChange([...indicadores, { nome: s.nome, expressao: { formula: s.formula } }]) }

  return (
    <div className="space-y-4">
      <div>
        <Rotulo className="text-sm" dica={DICAS.catalogo}>Catálogo de dados <span className="text-muted-foreground text-xs font-normal">({catalogo.length.toLocaleString('pt-BR')})</span></Rotulo>
        <div className="flex gap-2 mt-1">
          <Input placeholder="Buscar: xG, Pinnacle, over 2.5, escanteios…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className="bg-background border border-input rounded-md text-sm px-2 max-w-[45%]" value={bloco} onChange={(e) => setBloco(e.target.value)}>
            <option value="">todos os grupos</option>
            {Object.entries(ROTULO_BLOCO).map(([k, r]) => <option key={k} value={k}>{r}</option>)}
          </select>
        </div>
        <div className="max-h-56 overflow-y-auto mt-2 space-y-1 pr-1">
          {campos.map((c) => (
            <div key={c.key} className="flex items-center gap-2 text-xs border-b border-border/40 py-1">
              <button type="button" className="text-left flex-1 min-w-0" onClick={() => copiar(c.key)} title={`${c.descricao ? c.descricao + '\n' : ''}Clique para copiar ${c.key}`}>
                <span className="block truncate">{c.label}</span>
                <span className="block font-mono text-[10px] text-primary/80 truncate">{c.key}</span>
              </button>
              <Badge variant="outline" className="text-[10px] shrink-0">{rotuloTipo(c.tipo)}</Badge>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" title="Copiar nome" onClick={() => copiar(c.key)}><Copy className="w-3 h-3" /></Button>
            </div>
          ))}
          {!campos.length && <p className="text-xs text-muted-foreground">Nenhum dado encontrado.</p>}
        </div>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Funções disponíveis nas fórmulas ({funcoes.length})</summary>
        <ul className="mt-1 space-y-0.5">
          {funcoes.map((f) => <li key={f.nome}><span className="font-mono text-primary">{f.assinatura}</span> <span className="text-muted-foreground">— {f.descricao}</span></li>)}
        </ul>
      </details>

      <div>
        <Rotulo className="text-sm" dica={DICAS.indicadores}>Indicadores desta estratégia</Rotulo>
        <div className="space-y-2 mt-1">
          {indicadores.map((i, k) => (
            <div key={i.nome} className="border border-border rounded-md p-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-primary">{i.nome}</span>
                {tiposIndicadores[i.nome] && <Badge variant="outline" className="text-[10px]">{rotuloTipo(tiposIndicadores[i.nome])}</Badge>}
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Guardar para usar em outras estratégias" onClick={() => void onSalvarServidor(i.nome, i.expressao.formula ?? '')}><Save className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Remover" onClick={() => onChange(indicadores.filter((_, j) => j !== k))}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
              <Textarea className="font-mono text-xs min-h-[40px]" value={i.expressao.formula ?? ''} onChange={(e) => onChange(indicadores.map((x, j) => (j === k ? { ...x, expressao: { formula: e.target.value } } : x)))} />
            </div>
          ))}
          {errosIndicadores.length > 0 && <ul className="text-xs text-data-red list-disc pl-4">{errosIndicadores.map((e, k) => <li key={k}>{e}</li>)}</ul>}
          <div className="border border-dashed border-border rounded-md p-2 space-y-1">
            <Input placeholder="nome (ex.: edge_h)" className="font-mono text-sm" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
            <Textarea placeholder="cálculo (ex.: odds.bet365.close.1x2.h * odds.pinnacle.close.1x2.novig_h - 1)" className="font-mono text-xs min-h-[48px]" value={novaFormula} onChange={(e) => setNovaFormula(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={adicionar}><Plus className="w-3 h-3 mr-1" />Adicionar indicador</Button>
          </div>
        </div>
      </div>

      {salvos.length > 0 && (
        <div>
          <Rotulo className="text-sm">Indicadores guardados {salvos.some((s) => !s.meu) && <span className="text-muted-foreground text-xs font-normal">(+ públicos)</span>}</Rotulo>
          <div className="max-h-40 overflow-y-auto space-y-1 mt-1 pr-1">
            {salvos.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <button type="button" className="font-mono text-primary hover:underline" onClick={() => usarSalvo(s)} title={`${s.formula}\nClique para usar nesta estratégia`}>{s.nome}</button>
                <Badge variant="outline" className="text-[10px]">{rotuloTipo(s.tipo)}</Badge>
                {!s.meu && <Badge variant="secondary" className="text-[10px]">público</Badge>}
                <span className="text-muted-foreground truncate flex-1 font-mono">{s.formula}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
