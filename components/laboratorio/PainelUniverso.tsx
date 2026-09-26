'use client'
/** Passo 1 — Universo: ligas (5 modos), temporadas, datas, fontes, tipo, rodadas iniciais, cobertura mínima. */
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { continenteDe, CONTINENTES } from '@/lib/laboratorio/ui/continentes'
import type { Universo } from '@/lib/laboratorio/engine/tipos'
import type { CompeticaoUI, ResumoUI } from '@/lib/laboratorio/ui/tipos'

type Modo = 'TODAS' | 'PADRAO' | 'CONTINENTE' | 'PAIS' | 'LIGA'

const COBERTURAS = [
  { key: 'odds.pinnacle.close.1x2.h', rotulo: 'Fechamento Pinnacle 1X2' },
  { key: 'odds.pinnacle.open.1x2.h', rotulo: 'Abertura Pinnacle 1X2' },
  { key: 'odds.bet365.close.1x2.h', rotulo: 'Fechamento bet365 1X2' },
  { key: 'odds.bet365.open.1x2.h', rotulo: 'Abertura bet365 1X2' },
  { key: 'home.l10.xg_for', rotulo: 'xG (janela 10) do mandante' },
  { key: 'match.ht_h', rotulo: 'Placar do 1º tempo' },
]

export function PainelUniverso({ universo, onChange, resumo }: { universo: Universo; onChange: (u: Universo) => void; resumo: ResumoUI | null }) {
  const comps = useMemo(() => (resumo?.competicoes ?? []).filter((c) => !c.feminino), [resumo])
  const [modo, setModo] = useState<Modo>(universo.competicoes?.length ? 'LIGA' : 'PADRAO')
  const [busca, setBusca] = useState('')
  const [continentes, setContinentes] = useState<string[]>([])
  const [paises, setPaises] = useState<string[]>([])

  const porContinente = useMemo(() => { const m = new Map<string, CompeticaoUI[]>(); for (const c of comps) { const k = continenteDe(c.pais); let a = m.get(k); if (!a) { a = []; m.set(k, a) } a.push(c) } return m }, [comps])
  const paisesLista = useMemo(() => Array.from(new Set(comps.map((c) => c.pais))).sort(), [comps])
  const labels = useMemo(() => { const s = new Map<string, number>(); for (const c of comps) for (const t of c.temporadas) s.set(t.label, (s.get(t.label) ?? 0) + t.linhas); return Array.from(s.entries()).sort((a, b) => a[0].localeCompare(b[0])) }, [comps])

  const aplicar = (keys: string[] | undefined) => onChange({ ...universo, competicoes: keys })
  const mudarModo = (m: Modo) => {
    setModo(m)
    if (m === 'TODAS') aplicar(undefined)
    if (m === 'PADRAO') aplicar(comps.filter((c) => c.incluidaPorPadrao).map((c) => c.key))
    if (m === 'CONTINENTE') aplicar(continentes.flatMap((k) => (porContinente.get(k) ?? []).map((c) => c.key)))
    if (m === 'PAIS') aplicar(comps.filter((c) => paises.includes(c.pais)).map((c) => c.key))
  }
  const toggleContinente = (k: string) => { const n = continentes.includes(k) ? continentes.filter((x) => x !== k) : [...continentes, k]; setContinentes(n); aplicar(n.flatMap((c) => (porContinente.get(c) ?? []).map((x) => x.key))) }
  const togglePais = (p: string) => { const n = paises.includes(p) ? paises.filter((x) => x !== p) : [...paises, p]; setPaises(n); aplicar(comps.filter((c) => n.includes(c.pais)).map((c) => c.key)) }
  const toggleLiga = (k: string) => { const atual = universo.competicoes ?? []; aplicar(atual.includes(k) ? atual.filter((x) => x !== k) : [...atual, k]) }
  const toggleLabel = (l: string) => { const atual = universo.temporadasLabel ?? []; const n = atual.includes(l) ? atual.filter((x) => x !== l) : [...atual, l]; onChange({ ...universo, temporadasLabel: n.length ? n : undefined }) }
  const toggleCobertura = (k: string) => { const atual = universo.coberturaMinima ?? []; const n = atual.includes(k) ? atual.filter((x) => x !== k) : [...atual, k]; onChange({ ...universo, coberturaMinima: n.length ? n : undefined }) }
  const nSel = universo.competicoes?.length ?? comps.length
  const ligasFiltradas = comps.filter((c) => !busca || `${c.nome} ${c.pais}`.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Ligas</Label>
        <Badge variant="secondary">{nSel} de {comps.length}</Badge>
      </div>
      <Select value={modo} onValueChange={(v) => mudarModo(v as Modo)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="PADRAO">Ligas padrão (núcleo + FPT com amostra)</SelectItem>
          <SelectItem value="TODAS">Todas as ligas do dataset</SelectItem>
          <SelectItem value="CONTINENTE">Por continente</SelectItem>
          <SelectItem value="PAIS">Por país</SelectItem>
          <SelectItem value="LIGA">Liga a liga</SelectItem>
        </SelectContent>
      </Select>
      {modo === 'CONTINENTE' && (
        <div className="grid grid-cols-2 gap-2">
          {CONTINENTES.map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm"><Checkbox checked={continentes.includes(k)} onCheckedChange={() => toggleContinente(k)} />{k} <span className="text-muted-foreground text-xs">({porContinente.get(k)?.length ?? 0})</span></label>
          ))}
        </div>
      )}
      {modo === 'PAIS' && (
        <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-1 pr-1">
          {paisesLista.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm"><Checkbox checked={paises.includes(p)} onCheckedChange={() => togglePais(p)} />{p}</label>
          ))}
        </div>
      )}
      {modo === 'LIGA' && (
        <div className="space-y-2">
          <Input placeholder="Buscar liga ou país…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {ligasFiltradas.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={(universo.competicoes ?? []).includes(c.key)} onCheckedChange={() => toggleLiga(c.key)} />
                <span className="truncate">{c.nome}</span>
                <span className="text-muted-foreground text-xs ml-auto whitespace-nowrap">{c.pais}{c.soFpt ? ' · FPT' : ''} · {c.linhas}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>Temporadas <span className="text-muted-foreground text-xs">(vazio = todas)</span></Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {labels.map(([l, n]) => {
            const on = (universo.temporadasLabel ?? []).includes(l)
            return <button key={l} type="button" onClick={() => toggleLabel(l)} className={`px-2 py-0.5 rounded-full text-xs border ${on ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground'}`} title={`${n} jogos`}>{l}</button>
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-xs">De</Label><Input type="date" value={universo.de ?? ''} onChange={(e) => onChange({ ...universo, de: e.target.value || undefined })} /></div>
        <div><Label className="text-xs">Até</Label><Input type="date" value={universo.ate ?? ''} onChange={(e) => onChange({ ...universo, ate: e.target.value || undefined })} /></div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex items-center gap-2"><Switch checked={(universo.fontes ?? ['core', 'fpt']).includes('core')} onCheckedChange={(v) => { const f = new Set(universo.fontes ?? ['core', 'fpt']); if (v) f.add('core'); else f.delete('core'); onChange({ ...universo, fontes: Array.from(f) as ('core' | 'fpt')[] }) }} />Núcleo</label>
        <label className="flex items-center gap-2"><Switch checked={(universo.fontes ?? ['core', 'fpt']).includes('fpt')} onCheckedChange={(v) => { const f = new Set(universo.fontes ?? ['core', 'fpt']); if (v) f.add('fpt'); else f.delete('fpt'); onChange({ ...universo, fontes: Array.from(f) as ('core' | 'fpt')[] }) }} />Só-FPT</label>
        <label className="flex items-center gap-2"><Switch checked={!universo.tipos || universo.tipos.includes('LEAGUE')} onCheckedChange={(v) => onChange({ ...universo, tipos: v ? undefined : ['CUP', 'INTERNATIONAL_CLUBS'] })} />Ligas</label>
        <label className="flex items-center gap-2"><Switch checked={!universo.tipos || universo.tipos.includes('CUP')} onCheckedChange={(v) => onChange({ ...universo, tipos: v ? undefined : ['LEAGUE'] })} />Copas</label>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div><Label className="text-xs">Excluir rodadas iniciais</Label><Input type="number" min={0} max={38} value={universo.excluirRodadasIniciais ?? 0} onChange={(e) => onChange({ ...universo, excluirRodadasIniciais: Number(e.target.value) || undefined })} /></div>
      </div>

      <div>
        <Label className="text-xs">Cobertura mínima (jogo entra só se tiver)</Label>
        <div className="space-y-1 mt-1">
          {COBERTURAS.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm"><Checkbox checked={(universo.coberturaMinima ?? []).includes(c.key)} onCheckedChange={() => toggleCobertura(c.key)} />{c.rotulo}</label>
          ))}
        </div>
      </div>
    </div>
  )
}
