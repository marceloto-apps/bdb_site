'use client'
/** Modo Explorar — painel direito: matriz liga (× temporada) × aposta (ou × faixa da estatística), com detalhe e "Levar ao Laboratório". */
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Compass } from 'lucide-react'
import { corSinal, inteiro, num, pct, sinal } from '@/lib/laboratorio/ui/formato'
import { chaveCelula, indexarCelulas, limiarSidak, pDeflacionado, persistencia, type CelulaUI, type ResultadoExploracaoUI } from '@/lib/laboratorio/ui/explorador'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import { Dica } from './Dica'

type Metrica = 'yield' | 'clv'
interface Coluna { chave: string; rotulo: string; aposta: string; faixa: number }
interface Linha { chave: string; rotulo: string; sub?: string; competicao: string; temporada: string }

export function Explorador({ resultado, executando, progresso, nMin, onLevar }: {
  resultado: ResultadoExploracaoUI | null
  executando: boolean
  progresso: { fase: string; feitos: number; total: number } | null
  nMin: number
  onLevar: (c: CelulaUI) => void
}) {
  const [visao, setVisao] = useState<'liga' | 'temporada'>('liga')
  const [metrica, setMetrica] = useState<Metrica>('yield')
  const [apostaSel, setApostaSel] = useState<string>('')
  const [ordem, setOrdem] = useState<string | null>(null)
  const [sel, setSel] = useState<CelulaUI | null>(null)

  const idx = useMemo(() => (resultado ? indexarCelulas(resultado) : new Map<string, CelulaUI>()), [resultado])
  const temCruz = !!resultado?.cruzamento && (resultado?.faixas.length ?? 0) > 0
  const aposta = temCruz ? (resultado!.apostas.includes(apostaSel) ? apostaSel : resultado!.apostas[0]) : ''

  const colunas: Coluna[] = useMemo(() => {
    if (!resultado) return []
    if (temCruz) return [{ chave: 'todas', rotulo: 'Todas as faixas', aposta, faixa: -1 }, ...resultado.faixas.map((f, k) => ({ chave: `f${k}`, rotulo: f.rotulo, aposta, faixa: k }))]
    return resultado.apostas.map((a) => ({ chave: a, rotulo: a, aposta: a, faixa: -1 }))
  }, [resultado, temCruz, aposta])

  const valor = (c: CelulaUI | undefined) => (c ? (metrica === 'yield' ? c.yield : c.clvNovigMedio) : null)
  const linhas: Linha[] = useMemo(() => {
    if (!resultado) return []
    const base: Linha[] = [{ chave: '*', rotulo: 'Todas as ligas', competicao: '*', temporada: '*' }]
    const comps = visao === 'liga'
      ? resultado.competicoes.map((c) => ({ chave: c.key, rotulo: c.nome, sub: `${c.temporadas.length} temporada(s)`, competicao: c.key, temporada: '*' }))
      : resultado.competicoes.flatMap((c) => c.temporadas.map((t) => ({ chave: `${c.key}|${t}`, rotulo: c.nome, sub: t, competicao: c.key, temporada: t })))
    const col = colunas.find((x) => x.chave === ordem) ?? colunas[0]
    if (col) comps.sort((a, b) => {
      const ca = idx.get(chaveCelula(a.competicao, a.temporada, col.aposta, col.faixa)), cb = idx.get(chaveCelula(b.competicao, b.temporada, col.aposta, col.faixa))
      const va = (ca?.n ?? 0) >= nMin ? valor(ca) ?? -Infinity : -Infinity, vb = (cb?.n ?? 0) >= nMin ? valor(cb) ?? -Infinity : -Infinity
      return vb - va || a.rotulo.localeCompare(b.rotulo)
    })
    return base.concat(comps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado, visao, colunas, ordem, idx, nMin, metrica])

  const nCelulas = useMemo(() => {
    let n = 0
    for (const l of linhas) if (l.competicao !== '*') for (const c of colunas) { const x = idx.get(chaveCelula(l.competicao, l.temporada, c.aposta, c.faixa)); if (x && (x.n ?? 0) >= nMin) n++ }
    return n
  }, [linhas, colunas, idx, nMin])
  const limiar = limiarSidak(nCelulas)

  if (!resultado && !executando) {
    return (
      <div className="min-h-[450px] flex items-center justify-center bg-card rounded-2xl border border-dashed border-border text-center p-8">
        <div className="max-w-md"><Compass className="w-8 h-8 mx-auto text-primary mb-2" /><p className="text-lg font-display">Escolha as apostas à esquerda e clique em Explorar.</p><p className="text-sm text-muted-foreground mt-2">Cada aposta é feita em todos os jogos do universo. A matriz mostra em quais ligas (e em quais situações) ela teria pago.</p></div>
      </div>
    )
  }
  if (!resultado) {
    return (
      <div className="min-h-[450px] flex items-center justify-center bg-card rounded-2xl border border-border p-8">
        <div className="w-full max-w-md text-center space-y-3">
          <p className="text-sm">{progresso?.fase === 'baixando' ? `Baixando dados… ${progresso.feitos}/${progresso.total}` : 'Explorando…'}</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: progresso && progresso.total ? `${Math.round((progresso.feitos / progresso.total) * 100)}%` : '10%' }} /></div>
        </div>
      </div>
    )
  }

  const cor = (v: number | null, apagada: boolean) => (apagada || v === null ? '' : v > 0 ? `rgba(34,197,94,${Math.min(0.12 + Math.abs(v) * 3, 0.75)})` : `rgba(239,68,68,${Math.min(0.12 + Math.abs(v) * 3, 0.75)})`)
  const colOrdem = colunas.find((x) => x.chave === ordem) ?? colunas[0]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">{inteiro(resultado.nUniverso)} jogos</Badge>
        <Badge variant="secondary" className="flex items-center gap-1">{inteiro(nCelulas)} células com amostra<Dica texto={DICAS.celulas} /></Badge>
        <span className="text-muted-foreground">★ = significativo mesmo descontando as {inteiro(nCelulas)} células (p &lt; {num(limiar, 4)})</span>
        {resultado.cruzamento && <Badge variant="outline">{resultado.cruzamento.rotulo}{(resultado.cruzamento.semDado ?? 0) > 0 ? ` · ${inteiro(resultado.cruzamento.semDado)} jogos sem o dado` : ''}</Badge>}
        <div className="ml-auto flex items-center gap-2">
          {temCruz && <select className="bg-background border border-input rounded-md text-xs px-1 h-7 max-w-[220px]" value={aposta} onChange={(e) => { setApostaSel(e.target.value); setOrdem(null) }}>{resultado.apostas.map((a) => <option key={a} value={a}>{a}</option>)}</select>}
          <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={visao} onChange={(e) => setVisao(e.target.value as 'liga' | 'temporada')}><option value="liga">por liga</option><option value="temporada">por liga e temporada</option></select>
          <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={metrica} onChange={(e) => setMetrica(e.target.value as Metrica)}><option value="yield">cor = yield</option><option value="clv">cor = CLV</option></select>
        </div>
      </div>

      <div className="overflow-auto max-h-[560px] bg-card border border-border rounded-2xl">
        <table className="text-xs w-full border-separate border-spacing-0">
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              <th className="text-left p-2 border-b border-border">Liga</th>
              {colunas.map((c) => <th key={c.chave} className={`p-2 border-b border-border text-center cursor-pointer whitespace-nowrap ${colOrdem?.chave === c.chave ? 'text-primary' : ''}`} title="Ordenar por esta coluna" onClick={() => setOrdem(c.chave)}>{c.rotulo}{colOrdem?.chave === c.chave ? ' ▾' : ''}</th>)}
              {visao === 'liga' && <th className="p-2 border-b border-border text-center whitespace-nowrap"><span className="inline-flex items-center gap-1">Persistência<Dica texto={DICAS.persistencia} /></span></th>}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const comp = resultado.competicoes.find((c) => c.key === l.competicao)
              const pers = visao === 'liga' && comp && colOrdem ? persistencia(idx, comp, colOrdem.aposta, colOrdem.faixa, Math.max(30, Math.floor(nMin / 3))) : null
              return (
                <tr key={l.chave} className={l.competicao === '*' ? 'font-semibold bg-muted/30' : ''}>
                  <td className="p-2 border-b border-border/40 whitespace-nowrap">{l.rotulo}{l.sub && <span className="text-muted-foreground font-normal ml-1">· {l.sub}</span>}</td>
                  {colunas.map((c) => {
                    const cel = idx.get(chaveCelula(l.competicao, l.temporada, c.aposta, c.faixa))
                    const n = cel?.n ?? 0, apagada = n < nMin
                    const v = valor(cel)
                    const sig = !apagada && cel?.pValor !== null && cel?.pValor !== undefined && cel.pValor < limiar && (cel.lucro ?? 0) > 0
                    const ativa = sel && cel && sel === cel
                    return (
                      <td key={c.chave} className={`p-1 border-b border-border/40 text-center cursor-pointer ${apagada ? 'text-muted-foreground/50' : ''} ${ativa ? 'outline outline-2 outline-primary' : ''}`} style={{ background: cor(v, apagada) }} onClick={() => cel && setSel(cel)}
                        title={cel ? `${inteiro(n)} apostas · yield ${pct(cel.yield)} · CLV ${pct(cel.clvNovigMedio)} · acerto ${pct(cel.hitRate)} · odd ${num(cel.oddMedia)} · p ${num(cel.pValor, 3)}` : 'sem apostas'}>
                        {cel ? <><span className={apagada ? '' : 'font-semibold'}>{pct(v, 1)}{sig ? ' ★' : ''}</span><br /><span className="text-[10px] text-muted-foreground">{inteiro(n)}</span></> : <span className="text-muted-foreground/40">—</span>}
                      </td>
                    )
                  })}
                  {visao === 'liga' && <td className="p-1 border-b border-border/40 text-center">{pers && pers.total > 0 ? <span className={pers.positivas === pers.total ? 'text-primary font-semibold' : pers.positivas === 0 ? 'text-data-red' : ''}>{pers.positivas}/{pers.total}</span> : <span className="text-muted-foreground/40">—</span>}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sel && (
        <div className="bg-card border border-primary/40 rounded-2xl p-3 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="font-semibold">{sel.aposta} · {sel.competicao === '*' ? 'todas as ligas' : resultado.competicoes.find((c) => c.key === sel.competicao)?.nome ?? sel.competicao}{sel.temporada !== '*' ? ` · ${sel.temporada}` : ''}{(sel.faixa ?? -1) >= 0 ? ` · ${resultado.cruzamento?.rotulo}: ${resultado.faixas[sel.faixa as number]?.rotulo}` : ''}</p>
            <p className="text-xs text-muted-foreground">{inteiro(sel.n)} apostas · yield <b className={corSinal(sel.yield)}>{pct(sel.yield)}</b> · lucro {sinal(sel.lucro)} u · acerto {pct(sel.hitRate)} · odd média {num(sel.oddMedia)} · CLV <b className={corSinal(sel.clvNovigMedio)}>{pct(sel.clvNovigMedio)}</b> ({inteiro(sel.nRef)} com referência) · p {num(sel.pValor, 4)} · p deflacionado {num(pDeflacionado(sel.pValor, nCelulas), 4)}</p>
          </div>
          <Button size="sm" className="ml-auto" onClick={() => onLevar(sel)}>Levar ao Laboratório<ArrowRight className="w-3 h-3 ml-1" /></Button>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">{resultado.tempoMs} ms{resultado.camposAusentes.length ? ` · sem dados no universo: ${resultado.camposAusentes.join(', ')}` : ''}</p>
    </div>
  )
}
