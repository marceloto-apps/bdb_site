'use client'
/**
 * Modo Explorar — painel direito: matriz liga (× temporada) × aposta (ou × faixa da estatística), detalhe da célula,
 * "Levar ao Laboratório", marcação de células e painel de seleção (copiar instrução / levar seleção).
 */
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, Bookmark, BookmarkCheck, Check, Compass, Copy, X } from 'lucide-react'
import { corSinal, inteiro, num, pct, sinal } from '@/lib/laboratorio/ui/formato'
import { chaveCelula, indexarCelulas, limiarSidak, nomeCompeticao, pDeflacionado, persistencia, resumoDaInstrucao, textoDaInstrucao, type CelulaUI, type ResultadoExploracaoUI } from '@/lib/laboratorio/ui/explorador'
import type { InstrucaoExploracao } from '@/lib/laboratorio/engine/tipos'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import { Dica } from './Dica'

type Metrica = 'yield' | 'clv'
interface Coluna { chave: string; rotulo: string; aposta: string; faixa: number }
interface Linha { chave: string; rotulo: string; sub?: string; competicao: string; temporada: string }

export function Explorador({ resultado, executando, progresso, nMin, onLevar, montarInstrucao, onLevarSelecao }: {
  resultado: ResultadoExploracaoUI | null
  executando: boolean
  progresso: { fase: string; feitos: number; total: number } | null
  nMin: number
  onLevar: (c: CelulaUI) => void
  /** monta a instrução (texto copiável) a partir das células marcadas */
  montarInstrucao: (celulas: CelulaUI[]) => InstrucaoExploracao | null
  onLevarSelecao: (i: InstrucaoExploracao) => void
}) {
  const [visao, setVisao] = useState<'liga' | 'temporada'>('liga')
  const [metrica, setMetrica] = useState<Metrica>('yield')
  const [apostaSel, setApostaSel] = useState<string>('')
  const [ordem, setOrdem] = useState<string | null>(null)
  const [sel, setSel] = useState<CelulaUI | null>(null)
  const [marcadas, setMarcadas] = useState<CelulaUI[]>([])
  const [verTexto, setVerTexto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [erroCopia, setErroCopia] = useState<string | null>(null)

  // nova exploração = nova matriz: a seleção e o detalhe zeram
  useEffect(() => { setSel(null); setMarcadas([]); setVerTexto(false) }, [resultado])

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
      ? resultado.competicoes.map((c) => ({ chave: c.key, rotulo: nomeCompeticao(c), sub: `${c.temporadas.length} temporada(s)`, competicao: c.key, temporada: '*' }))
      : resultado.competicoes.flatMap((c) => c.temporadas.map((t) => ({ chave: `${c.key}|${t}`, rotulo: nomeCompeticao(c), sub: t, competicao: c.key, temporada: t })))
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

  const instrucao = useMemo(() => (marcadas.length ? montarInstrucao(marcadas) : null), [marcadas, montarInstrucao])
  const texto = useMemo(() => (instrucao ? textoDaInstrucao(instrucao) : ''), [instrucao])
  const marcada = (c: CelulaUI | undefined) => !!c && marcadas.includes(c)
  const alternarMarca = (c: CelulaUI) => setMarcadas((m) => (m.includes(c) ? m.filter((x) => x !== c) : [...m, c]))
  const copiar = async () => {
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setErroCopia(null); setTimeout(() => setCopiado(false), 2000) }
    catch { setErroCopia('Não foi possível copiar automaticamente; use "Ver texto" e copie manualmente.'); setVerTexto(true) }
  }

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
  const nomeDa = (c: CelulaUI) => (c.competicao === '*' ? 'todas as ligas' : nomeCompeticao(resultado.competicoes.find((x) => x.key === c.competicao), c.competicao))
  const rotuloCelula = (c: CelulaUI) => `${c.aposta} · ${nomeDa(c)}${c.temporada !== '*' ? ` · ${c.temporada}` : ''}${(c.faixa ?? -1) >= 0 ? ` · ${resultado.cruzamento?.rotulo}: ${resultado.faixas[c.faixa as number]?.rotulo}` : ''}`

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary">{inteiro(resultado.nUniverso)} jogos</Badge>
        <Badge variant="secondary" className="flex items-center gap-1">{inteiro(nCelulas)} células com amostra<Dica texto={DICAS.celulas} /></Badge>
        <span className="text-muted-foreground">★ = significativo mesmo descontando as {inteiro(nCelulas)} células (p &lt; {num(limiar, 4)})</span>
        {resultado.cruzamento && <Badge variant="outline">{resultado.cruzamento.rotulo}{(resultado.cruzamento.semDado ?? 0) > 0 ? ` · ${inteiro(resultado.cruzamento.semDado)} jogos sem o dado` : ''}</Badge>}
        {(resultado.avisos ?? []).map((a) => <span key={a} className="text-amber-500" title={a}>⚠ {a.length > 90 ? `${a.slice(0, 90)}…` : a}</span>)}
        <div className="ml-auto flex items-center gap-2">
          {temCruz && <select className="bg-background border border-input rounded-md text-xs px-1 h-7 max-w-[220px]" value={aposta} onChange={(e) => { setApostaSel(e.target.value); setOrdem(null) }}>{resultado.apostas.map((a) => <option key={a} value={a}>{a}</option>)}</select>}
          <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={visao} onChange={(e) => setVisao(e.target.value as 'liga' | 'temporada')}><option value="liga">por liga</option><option value="temporada">por liga e temporada</option></select>
          <select className="bg-background border border-input rounded-md text-xs px-1 h-7" value={metrica} onChange={(e) => setMetrica(e.target.value as Metrica)}><option value="yield">cor = yield</option><option value="clv">cor = CLV</option></select>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Bookmark className="w-3 h-3 text-amber-400" />Clique numa célula para ver o detalhe e “Levar ao Laboratório”. Clique duas vezes (ou use “Marcar”) para pôr a célula na seleção; a seleção vira um texto para copiar ou levar inteira ao Laboratório.{marcadas.length ? ` Seleção: ${marcadas.length}.` : ''}</p>
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
                    const marc = marcada(cel)
                    return (
                      <td key={c.chave} className={`p-1 border-b border-border/40 text-center cursor-pointer relative ${apagada ? 'text-muted-foreground/50' : ''} ${ativa ? 'outline outline-2 outline-primary' : ''} ${marc ? 'ring-2 ring-inset ring-amber-400' : ''}`} style={{ background: cor(v, apagada) }} onClick={() => cel && setSel(cel)} onDoubleClick={() => { if (cel) { setSel(cel); alternarMarca(cel) } }}
                        title={cel ? `${marc ? 'MARCADA · ' : ''}${inteiro(n)} apostas · yield ${pct(cel.yield)} · CLV ${pct(cel.clvNovigMedio)} · acerto ${pct(cel.hitRate)} · odd ${num(cel.oddMedia)} · p ${num(cel.pValor, 3)}` : 'sem apostas'}>
                        {cel ? <><span className={apagada ? '' : 'font-semibold'}>{pct(v, 1)}{sig ? ' ★' : ''}</span><br /><span className="text-[10px] text-muted-foreground">{inteiro(n)}</span>{marc && <Bookmark className="w-3 h-3 text-amber-400 absolute top-0.5 right-0.5" />}</> : <span className="text-muted-foreground/40">—</span>}
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
            <p className="font-semibold">{rotuloCelula(sel)}</p>
            <p className="text-xs text-muted-foreground">{inteiro(sel.n)} apostas · yield <b className={corSinal(sel.yield)}>{pct(sel.yield)}</b> · lucro {sinal(sel.lucro)} u · acerto {pct(sel.hitRate)} · odd média {num(sel.oddMedia)} · CLV <b className={corSinal(sel.clvNovigMedio)}>{pct(sel.clvNovigMedio)}</b> ({inteiro(sel.nRef)} com referência) · p {num(sel.pValor, 4)} · p deflacionado {num(pDeflacionado(sel.pValor, nCelulas), 4)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant={marcada(sel) ? 'secondary' : 'outline'} onClick={() => alternarMarca(sel)} title={DICAS.marcar}>{marcada(sel) ? <BookmarkCheck className="w-3 h-3 mr-1" /> : <Bookmark className="w-3 h-3 mr-1" />}{marcada(sel) ? 'Marcada' : 'Marcar'}</Button>
            <Button size="sm" onClick={() => onLevar(sel)}>Levar ao Laboratório<ArrowRight className="w-3 h-3 ml-1" /></Button>
          </div>
        </div>
      )}

      {instrucao && (
        <div className="bg-card border border-amber-400/40 rounded-2xl p-3 text-sm space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold flex items-center gap-1"><BookmarkCheck className="w-4 h-4 text-amber-400" />Seleção ({marcadas.length})<Dica texto={DICAS.marcar} /></p>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void copiar()}>{copiado ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}{copiado ? 'Copiado' : 'Copiar instrução'}</Button>
              <Button size="sm" variant="ghost" onClick={() => setVerTexto((v) => !v)}>{verTexto ? 'Esconder texto' : 'Ver texto'}</Button>
              <Button size="sm" onClick={() => onLevarSelecao(instrucao)}>Levar seleção ao Laboratório<ArrowRight className="w-3 h-3 ml-1" /></Button>
              <Button size="sm" variant="ghost" onClick={() => setMarcadas([])}>Limpar</Button>
            </div>
          </div>
          <ul className="text-xs space-y-0.5">
            {marcadas.map((c, k) => (
              <li key={k} className="flex items-center gap-2">
                <button type="button" className="text-muted-foreground hover:text-data-red" title="Remover da seleção" onClick={() => alternarMarca(c)}><X className="w-3 h-3" /></button>
                <span>{rotuloCelula(c)}</span>
                <span className="text-muted-foreground">· {inteiro(c.n)} apostas · yield <b className={corSinal(c.yield)}>{pct(c.yield)}</b> · CLV {pct(c.clvNovigMedio)}</span>
              </li>
            ))}
          </ul>
          {erroCopia && <p className="text-xs text-data-red">{erroCopia}</p>}
          {verTexto && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{resumoDaInstrucao(instrucao)[0]} · cole este texto no passo “Da exploração” do modo Estratégia.</p>
              <Textarea readOnly value={texto} rows={8} className="font-mono text-[11px]" onFocus={(e) => e.currentTarget.select()} />
            </div>
          )}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">{resultado.tempoMs} ms{resultado.camposAusentes.length ? ` · sem dados no universo: ${resultado.camposAusentes.join(', ')}` : ''}</p>
    </div>
  )
}
