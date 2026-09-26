'use client'
/** Passo 1 — Universo: ligas (5 modos), temporadas, datas, fontes, tipo, rodadas iniciais, cobertura mínima. */
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { continenteDe, CONTINENTES } from '@/lib/laboratorio/ui/continentes'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import type { Universo } from '@/lib/laboratorio/engine/tipos'
import type { CompeticaoUI, ResumoUI } from '@/lib/laboratorio/ui/tipos'
import { Dica, Rotulo } from './Dica'

type Modo = 'TODAS' | 'PADRAO' | 'CONTINENTE' | 'PAIS' | 'LIGA'

const COBERTURAS = [
  { key: 'odds.pinnacle.close.1x2.h', rotulo: 'Odd de fechamento da Pinnacle (1X2)' },
  { key: 'odds.pinnacle.open.1x2.h', rotulo: 'Odd de abertura da Pinnacle (1X2)' },
  { key: 'odds.bet365.close.1x2.h', rotulo: 'Odd de fechamento da bet365 (1X2)' },
  { key: 'odds.bet365.open.1x2.h', rotulo: 'Odd de abertura da bet365 (1X2)' },
  { key: 'home.l10.xg_for', rotulo: 'xG do mandante (últimos 10 jogos)' },
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
  const setFonte = (f: 'core' | 'fpt', on: boolean) => { const s = new Set(universo.fontes ?? ['core', 'fpt']); if (on) s.add(f); else s.delete(f); onChange({ ...universo, fontes: Array.from(s) as ('core' | 'fpt')[] }) }
  const fontes = universo.fontes ?? ['core', 'fpt']
  const nSel = universo.competicoes?.length ?? comps.length
  const ligasFiltradas = comps.filter((c) => !busca || `${c.nome} ${c.pais}`.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Rotulo className="text-sm">Competições</Rotulo>
        <Badge variant="secondary">{nSel} de {comps.length}</Badge>
      </div>
      <Select value={modo} onValueChange={(v) => mudarModo(v as Modo)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="PADRAO">Ligas padrão (recomendado)</SelectItem>
          <SelectItem value="TODAS">Todas as competições do dataset</SelectItem>
          <SelectItem value="CONTINENTE">Por continente</SelectItem>
          <SelectItem value="PAIS">Por país</SelectItem>
          <SelectItem value="LIGA">Escolher uma a uma</SelectItem>
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
          <Input placeholder="Buscar competição ou país…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {ligasFiltradas.map((c) => (
              <label key={c.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={(universo.competicoes ?? []).includes(c.key)} onCheckedChange={() => toggleLiga(c.key)} />
                <span className="truncate">{c.nome}</span>
                <span className="text-muted-foreground text-xs ml-auto whitespace-nowrap" title={c.soFpt ? 'Liga extra (Football-Data)' : 'Liga do BDB'}>{c.pais}{c.soFpt ? ' · extra' : ''} · {c.linhas.toLocaleString('pt-BR')} jogos</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <Rotulo className="text-xs" dica={DICAS.temporadas}>Temporadas <span className="text-muted-foreground font-normal">(vazio = todas)</span></Rotulo>
        <div className="flex flex-wrap gap-1 mt-1">
          {labels.map(([l, n]) => {
            const on = (universo.temporadasLabel ?? []).includes(l)
            return <button key={l} type="button" onClick={() => toggleLabel(l)} className={`px-2 py-0.5 rounded-full text-xs border ${on ? 'bg-primary/20 border-primary text-primary' : 'border-border text-muted-foreground'}`} title={`${n.toLocaleString('pt-BR')} jogos`}>{l}</button>
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div><Rotulo className="text-xs">Jogos a partir de</Rotulo><Input type="date" value={universo.de ?? ''} onChange={(e) => onChange({ ...universo, de: e.target.value || undefined })} /></div>
        <div><Rotulo className="text-xs">Jogos até</Rotulo><Input type="date" value={universo.ate ?? ''} onChange={(e) => onChange({ ...universo, ate: e.target.value || undefined })} /></div>
      </div>

      <div className="space-y-2 text-sm">
        <Rotulo className="text-xs">Fonte dos jogos</Rotulo>
        <label className="flex items-center gap-2"><Switch checked={fontes.includes('core')} onCheckedChange={(v) => setFonte('core', v)} />Ligas do BDB <span className="text-muted-foreground text-xs">(bet365 + Pinnacle)</span><Dica texto={DICAS.fonteBdb} /></label>
        <label className="flex items-center gap-2"><Switch checked={fontes.includes('fpt')} onCheckedChange={(v) => setFonte('fpt', v)} />Ligas extras <span className="text-muted-foreground text-xs">(Football-Data)</span><Dica texto={DICAS.fonteExtra} /></label>
        <Rotulo className="text-xs">Tipo de competição</Rotulo>
        <label className="flex items-center gap-2"><Switch checked={!universo.tipos || universo.tipos.includes('LEAGUE')} onCheckedChange={(v) => onChange({ ...universo, tipos: v ? undefined : ['CUP', 'INTERNATIONAL_CLUBS'] })} />Campeonatos <span className="text-muted-foreground text-xs">(pontos corridos)</span><Dica texto={DICAS.tipoLiga} /></label>
        <label className="flex items-center gap-2"><Switch checked={!universo.tipos || universo.tipos.includes('CUP')} onCheckedChange={(v) => onChange({ ...universo, tipos: v ? undefined : ['LEAGUE'] })} />Copas e torneios internacionais<Dica texto={DICAS.tipoCopa} /></label>
      </div>

      <div className="grid grid-cols-2 gap-2 items-end">
        <div><Rotulo className="text-xs" dica={DICAS.rodadasIniciais}>Ignorar as primeiras rodadas</Rotulo><Input type="number" min={0} max={38} value={universo.excluirRodadasIniciais ?? 0} onChange={(e) => onChange({ ...universo, excluirRodadasIniciais: Number(e.target.value) || undefined })} /></div>
      </div>

      <div>
        <Rotulo className="text-xs" dica={DICAS.cobertura}>Só jogos que tenham</Rotulo>
        <div className="space-y-1 mt-1">
          {COBERTURAS.map((c) => (
            <label key={c.key} className="flex items-center gap-2 text-sm"><Checkbox checked={(universo.coberturaMinima ?? []).includes(c.key)} onCheckedChange={() => toggleCobertura(c.key)} />{c.rotulo}</label>
          ))}
        </div>
      </div>
    </div>
  )
}
