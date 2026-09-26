'use client'
/** Salvar / carregar / duplicar / apagar estratégias e runs salvos. */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Copy, FolderOpen, Save, Trash2 } from 'lucide-react'
import { dataHora, pct } from '@/lib/laboratorio/ui/formato'
import type { EstrategiaSalvaUI, RunSalvoUI } from '@/lib/laboratorio/ui/tipos'

export function EstrategiasSalvas({ salvas, atualId, atualNome, runs, onSalvar, onCarregar, onDuplicar, onApagar, onSalvarRun, temRun }: {
  salvas: EstrategiaSalvaUI[]
  atualId: string | null
  atualNome: string
  runs: RunSalvoUI[]
  onSalvar: (nome: string, descricao: string, publica: boolean, comoNova: boolean) => Promise<void>
  onCarregar: (id: string) => Promise<void>
  onDuplicar: (id: string) => Promise<void>
  onApagar: (id: string) => Promise<void>
  onSalvarRun: () => Promise<void>
  temRun: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState(atualNome)
  const [descricao, setDescricao] = useState('')
  const [publica, setPublica] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const abrir = () => { setNome(atualNome || ''); setAberto(true) }
  const confirmar = async (comoNova: boolean) => { if (!nome.trim()) return; setSalvando(true); try { await onSalvar(nome.trim(), descricao, publica, comoNova) ; setAberto(false) } finally { setSalvando(false) } }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={abrir}><Save className="w-3 h-3 mr-1" />{atualId ? 'Salvar alterações' : 'Salvar estratégia'}</Button>
        <Button size="sm" variant="outline" disabled={!temRun} onClick={() => void onSalvarRun()} title={atualId ? 'Guarda o resultado deste run ligado à estratégia' : 'Guarda o resultado deste run'}>Salvar run</Button>
      </div>
      {atualId && <p className="text-xs text-muted-foreground">Editando: <b>{atualNome}</b> · {salvas.find((s) => s.id === atualId)?.tentativas ?? 0} tentativa(s) registrada(s)</p>}

      <div>
        <Label className="text-xs">Minhas estratégias {salvas.some((s) => !s.minha) && <span className="text-muted-foreground">(+ públicas)</span>}</Label>
        <div className="max-h-56 overflow-y-auto space-y-1 mt-1 pr-1">
          {salvas.map((s) => (
            <div key={s.id} className={`flex items-center gap-2 text-xs border rounded-md px-2 py-1 ${s.id === atualId ? 'border-primary/60 bg-primary/5' : 'border-border'}`}>
              <button type="button" className="text-left flex-1 truncate hover:underline" onClick={() => void onCarregar(s.id)} title={s.descricao ?? ''}>
                {s.nome}
                <span className="text-muted-foreground ml-1">· {s.runs} run(s) · {s.tentativas} tent.</span>
              </button>
              {!s.minha && <Badge variant="secondary" className="text-[10px]">pública</Badge>}
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Carregar" onClick={() => void onCarregar(s.id)}><FolderOpen className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Duplicar" onClick={() => void onDuplicar(s.id)}><Copy className="w-3 h-3" /></Button>
              {s.minha && <Button variant="ghost" size="icon" className="h-6 w-6" title="Apagar" onClick={() => { if (confirm(`Apagar "${s.nome}"?`)) void onApagar(s.id) }}><Trash2 className="w-3 h-3" /></Button>}
            </div>
          ))}
          {!salvas.length && <p className="text-xs text-muted-foreground">Nenhuma estratégia salva ainda.</p>}
        </div>
      </div>

      {runs.length > 0 && (
        <div>
          <Label className="text-xs">Runs salvos desta estratégia</Label>
          <div className="max-h-40 overflow-y-auto space-y-1 mt-1 pr-1">
            {runs.map((r) => (
              <div key={r.id} className="text-xs border border-border rounded-md px-2 py-1 flex items-center gap-2">
                <span className="text-muted-foreground">{dataHora(r.createdAt)}</span>
                <span>n {r.nApostas}</span>
                <span className={r.resumo.kpis.yield !== null && r.resumo.kpis.yield > 0 ? 'text-primary' : 'text-data-red'}>{pct(r.resumo.kpis.yield)}</span>
                <span className="text-muted-foreground ml-auto font-mono">{r.datasetVersao} · {r.hash.slice(0, 8)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>{atualId ? 'Salvar estratégia' : 'Nova estratégia'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} /></div>
            <div><Label>Descrição (opcional)</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={4000} /></div>
            <label className="flex items-center gap-2 text-sm"><Switch checked={publica} onCheckedChange={setPublica} />Pública (outros assinantes podem ver e duplicar)</label>
          </div>
          <DialogFooter className="gap-2">
            {atualId && <Button variant="outline" disabled={salvando} onClick={() => void confirmar(true)}>Salvar como nova</Button>}
            <Button disabled={salvando || !nome.trim()} onClick={() => void confirmar(!atualId)}>{atualId ? 'Atualizar' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
