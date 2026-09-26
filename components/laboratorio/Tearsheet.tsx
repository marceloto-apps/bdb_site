'use client'
/** Painel direito: KPIs, gráfico banco real × esperado × CLV, underwater, abas (segmentos, mensal, inferência, apostas, comparação). */
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Trash2 } from 'lucide-react'
import { baixarTexto, csvApostas } from '@/lib/laboratorio/ui/csv'
import { corSinal, dataCurta, inteiro, num, pct, sinal } from '@/lib/laboratorio/ui/formato'
import { DICAS, ROTULO_AVISO, ROTULO_RESULTADO, rotuloMercado, rotuloSelecao } from '@/lib/laboratorio/ui/rotulos'
import { Dica } from './Dica'
import type { RunComparado, RunUI } from '@/lib/laboratorio/ui/tipos'

const TOOLTIP = { backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '10px', color: 'hsl(var(--foreground))', fontSize: 12 }

function Card({ titulo, valor, sub, cor, dica }: { titulo: string; valor: string; sub?: string; cor?: string; dica?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">{titulo}{dica && <Dica texto={dica} />}</p>
      <p className={`text-lg font-bold font-display ${cor ?? ''}`}>{valor}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

function amostrar<T>(xs: T[], max = 800): T[] {
  if (xs.length <= max) return xs
  const passo = xs.length / max
  const out: T[] = []
  for (let i = 0; i < max; i++) out.push(xs[Math.floor(i * passo)])
  out.push(xs[xs.length - 1])
  return out
}

export function Tearsheet({ run, executando, progresso, comparados, onGuardar, onRemoverComparado }: {
  run: RunUI | null
  executando: boolean
  progresso: { fase: string; feitos: number; total: number } | null
  comparados: RunComparado[]
  onGuardar: () => void
  onRemoverComparado: (k: number) => void
}) {
  const [pagina, setPagina] = useState(0)
  const serie = useMemo(() => {
    if (!run) return []
    const idx = run.apostas.map((_, i) => i)
    return amostrar(idx).map((i) => ({ i, real: run.caminho.cumulativo[i], esperado: run.clv.esperadoCumulativo[i], clv: run.clv.clvCumulativo[i], under: run.caminho.underwater[i], data: run.apostas[i]?.data ?? null }))
  }, [run])
  const mensal = useMemo(() => {
    if (!run) return { anos: [] as string[], meses: [] as string[], celulas: new Map<string, { yield: number; n: number; lucro: number }>() }
    const cel = new Map<string, { yield: number; n: number; lucro: number }>()
    const anos = new Set<string>()
    for (const s of run.segmentos.mes ?? []) { const [a] = s.chave.split('-'); anos.add(a); cel.set(s.chave, { yield: s.yield, n: s.n, lucro: s.lucro }) }
    return { anos: Array.from(anos).sort(), meses: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'], celulas: cel }
  }, [run])

  if (!run && !executando) {
    return (
      <div className="min-h-[450px] flex items-center justify-center bg-card rounded-2xl border border-dashed border-border text-center p-8">
        <div><p className="text-lg font-display">Monte a estratégia à esquerda e execute.</p><p className="text-sm text-muted-foreground mt-2">O cálculo roda no seu navegador; os dados vêm em blocos por liga e ficam em cache.</p></div>
      </div>
    )
  }
  if (!run) {
    return (
      <div className="min-h-[450px] flex items-center justify-center bg-card rounded-2xl border border-border p-8">
        <div className="w-full max-w-md text-center space-y-3">
          <p className="text-sm">{progresso?.fase === 'baixando' ? `Baixando dados… ${progresso.feitos}/${progresso.total}` : progresso?.fase === 'executando' ? 'Executando…' : 'Preparando…'}</p>
          <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: progresso && progresso.total ? `${Math.round((progresso.feitos / progresso.total) * 100)}%` : '10%' }} /></div>
        </div>
      </div>
    )
  }

  const k = run.kpis, c = run.caminho, v = run.clv, inf = run.inferencia
  const porPagina = 50
  const paginas = Math.max(1, Math.ceil(run.apostas.length / porPagina))
  const apostasPag = run.apostas.slice(pagina * porPagina, (pagina + 1) * porPagina)
  const exportar = () => baixarTexto(`laboratorio_${run.hash}.csv`, csvApostas(run.apostas as never))

  return (
    <div className="space-y-4">
      {run.avisos.length > 0 && (
        <div className="space-y-1">
          {run.avisos.map((a, i) => <p key={i} className={`text-xs rounded-md px-3 py-1.5 border ${a.tipo === 'leakage' ? 'border-data-red/50 bg-data-red/10 text-data-red' : a.tipo === 'amostra' || a.tipo === 'referencia' ? 'border-data-yellow/50 bg-data-yellow/10 text-data-yellow' : 'border-border bg-card text-muted-foreground'}`}><b className="uppercase text-[10px] mr-1">{ROTULO_AVISO[a.tipo] ?? a.tipo}</b>{a.mensagem}</p>)}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <Card titulo="Apostas" valor={inteiro(k.n)} sub={`${inteiro(run.nSelecionados)} jogos selecionados de ${inteiro(run.nUniverso)}`} />
        <Card titulo="Yield" valor={pct(k.yield)} sub={`lucro ${sinal(k.lucro)} u · ${inteiro(k.turnover)} u apostados`} cor={corSinal(k.yield)} dica={DICAS.yield} />
        <Card titulo="ROI do banco" valor={pct(k.roiBanco)} sub={`flat: ${pct(k.yieldFlat)}`} cor={corSinal(k.roiBanco)} dica={DICAS.roiBanco} />
        <Card titulo="Acerto" valor={pct(k.hitRate)} sub={`break-even ${pct(k.breakEvenHit)} · odd média ${num(k.oddMedia)}`} dica={DICAS.hitRate} />
        <Card titulo="Maior queda (MDD)" valor={`${num(c.mdd)} u`} sub={`${pct(c.mddPct)} · ${c.mddDuracao} apostas · rec. ${c.mddRecuperacao ?? '—'}`} cor="text-data-red" dica={DICAS.mdd} />
        <Card titulo="CLV (vs. fechamento)" valor={pct(v.clvNovigMedio)} sub={`bateu o fechamento em ${pct(v.beatRate)} · bruto ${pct(v.clvBrutoMedio)}`} cor={corSinal(v.clvNovigMedio)} dica={DICAS.clv} />
        <Card titulo="Yield esperado" valor={pct(v.yieldEsperado)} sub={`${v.nComRef} com referência${v.refSoft ? ` · ${pct(v.refSoft, 0)} sem Pinnacle` : ''}`} cor={corSinal(v.yieldEsperado)} dica={DICAS.yieldEsperado} />
        <Card titulo="p-valor" valor={num(inf.pValor, 4)} sub={`t ${num(inf.tYield)} · z Buchdahl ${num(inf.zBuchdahl)}`} cor={inf.pValor !== null && inf.pValor < 0.05 ? 'text-primary' : ''} dica={DICAS.pValor} />
        <Card titulo="Faixa do yield (95%)" valor={inf.ic95Yield ? `${pct(inf.ic95Yield[0], 1)} a ${pct(inf.ic95Yield[1], 1)}` : '—'} sub={`bootstrap ${inf.reamostras} · n mín. ${inf.nMinimo === 'Infinity' || inf.nMinimo === null ? '∞' : inteiro(inf.nMinimo)}`} dica={DICAS.ic95} />
        <Card titulo="Sharpe / PF" valor={`${num(c.sharpe, 3)} / ${num(k.profitFactor)}`} sub={`seq. derrotas ${c.maiorSequenciaDerrotas} · sem máx. ${c.maiorSemNovoMaximo}`} dica={DICAS.sharpe} />
      </div>

      <div className="bg-card border border-border p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Lucro real × esperado × CLV acumulado (u)</p>
          <div className="flex gap-3 text-[10px]"><span className="text-primary">■ real</span><span className="text-data-blue">┅ esperado (pela referência)</span><span className="text-data-yellow">■ CLV</span></div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="i" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(i) => String(i + 1)} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip contentStyle={TOOLTIP} labelFormatter={(i) => { const p = serie.find((s) => s.i === i); return `Aposta ${Number(i) + 1}${p?.data ? ` · ${dataCurta(p.data)}` : ''}` }} formatter={(val, nome) => [num(Number(val)), nome === 'real' ? 'Real' : nome === 'esperado' ? 'Esperado' : 'CLV']} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Line type="monotone" dataKey="real" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="esperado" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="clv" stroke="#eab308" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[90px] mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie}>
              <XAxis dataKey="i" hide /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} width={40} />
              <Tooltip contentStyle={TOOLTIP} formatter={(val) => [num(Number(val)), 'Underwater']} labelFormatter={(i) => `Aposta ${Number(i) + 1}`} />
              <Area type="monotone" dataKey="under" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Tabs defaultValue="segmentos">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="segmentos">Segmentos</TabsTrigger><TabsTrigger value="mensal">Mensal</TabsTrigger><TabsTrigger value="risco">Risco e estatística</TabsTrigger><TabsTrigger value="apostas">Apostas ({inteiro(run.apostas.length)})</TabsTrigger><TabsTrigger value="comparar">Comparar ({comparados.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="segmentos"><Segmentos run={run} /></TabsContent>

        <TabsContent value="mensal">
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead><tr><th className="text-left p-1">Ano</th>{mensal.meses.map((m) => <th key={m} className="p-1">{m}</th>)}</tr></thead>
              <tbody>{mensal.anos.map((a) => <tr key={a}><td className="p-1 font-mono">{a}</td>{mensal.meses.map((m) => { const c2 = mensal.celulas.get(`${a}-${m}`); const y = c2?.yield ?? null; const bg = y === null ? '' : y > 0 ? `rgba(34,197,94,${Math.min(0.15 + Math.abs(y) * 2, 0.8)})` : `rgba(239,68,68,${Math.min(0.15 + Math.abs(y) * 2, 0.8)})`; return <td key={m} className="p-1 text-center rounded" style={{ background: bg }} title={c2 ? `${c2.n} apostas · lucro ${sinal(c2.lucro)} u` : ''}>{c2 ? pct(y, 0) : ''}</td> })}</tr>)}</tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="risco">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-card border border-border rounded-xl p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Significância</p>
              <p>Margem média da odd de decisão: <b>{pct(inf.margemMedia)}</b></p>
              <p>t do yield: <b>{num(inf.tYield)}</b> · p-valor (bicaudal): <b>{num(inf.pValor, 4)}</b></p>
              <p>z de Buchdahl: <b>{num(inf.zBuchdahl)}</b> · n mínimo p/ significância: <b>{inf.nMinimo === 'Infinity' || inf.nMinimo === null ? '∞' : inteiro(inf.nMinimo)}</b></p>
              <p>IC95 yield: <b>{inf.ic95Yield ? `${pct(inf.ic95Yield[0])} a ${pct(inf.ic95Yield[1])}` : '—'}</b></p>
              <p>IC95 MDD: <b>{inf.ic95Mdd ? `${num(inf.ic95Mdd[0])} a ${num(inf.ic95Mdd[1])} u` : '—'}</b> · IC95 CLV: <b>{inf.ic95Clv ? `${pct(inf.ic95Clv[0])} a ${pct(inf.ic95Clv[1])}` : '—'}</b></p>
              <p>t do CLV: <b>{num(v.tClv)}</b> · CLV em pontos: <b>{pct(v.clvPontosMedio)}</b></p>
              {inf.amostraPequena && <p className="text-data-yellow text-xs">Amostra abaixo de 300 apostas.</p>}
            </div>
            <div className="bg-card border border-border rounded-xl p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Trajetória do banco</p>
              <p>Sharpe {num(c.sharpe, 3)} · Sortino {num(c.sortino, 3)} · Calmar {num(c.calmar, 3)}</p>
              <p>Payoff {num(k.payoff)} · Profit factor {num(k.profitFactor)}</p>
              <p>Ganhas {k.wins} · meio ganhas {k.halfWins} · devolvidas {k.refunds} · meio perdidas {k.halfLosses} · perdidas {k.losses} · anuladas {k.voids}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground pt-2">5 maiores drawdowns</p>
              <Table><TableHeader><TableRow><TableHead>u</TableHead><TableHead>%</TableHead><TableHead>duração</TableHead><TableHead>recuperação</TableHead></TableRow></TableHeader>
                <TableBody>{c.drawdowns.map((d, i) => <TableRow key={i}><TableCell>{num(d.profundidade)}</TableCell><TableCell>{pct(d.profundidadePct)}</TableCell><TableCell>{d.duracao}</TableCell><TableCell>{d.recuperacao ?? 'aberto'}</TableCell></TableRow>)}</TableBody></Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="apostas">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Página {pagina + 1} de {paginas}</p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>‹</Button>
              <Button size="sm" variant="outline" disabled={pagina >= paginas - 1} onClick={() => setPagina(pagina + 1)}>›</Button>
              <Button size="sm" variant="outline" onClick={exportar}><Download className="w-3 h-3 mr-1" />CSV</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Jogo</TableHead><TableHead>Aposta</TableHead><TableHead>Odd</TableHead><TableHead>Stake</TableHead><TableHead>Res.</TableHead><TableHead>P&L</TableHead><TableHead>CLV</TableHead><TableHead>Banco</TableHead></TableRow></TableHeader>
              <TableBody>
                {apostasPag.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs">{dataCurta(a.data)}</TableCell>
                    <TableCell className="text-xs"><span className="text-muted-foreground">{a.competicao}</span><br />{a.home} × {a.away}</TableCell>
                    <TableCell className="text-xs"><span className="text-muted-foreground">{a.entradaId} · {rotuloMercado(a.mercado)}</span><br />{rotuloSelecao(a.selecao)}{a.linha !== null ? ` ${a.linha}` : ''}</TableCell>
                    <TableCell>{num(a.odd)}</TableCell><TableCell>{num(a.stake)}</TableCell>
                    <TableCell><Badge variant={a.resultado === 'WIN' || a.resultado === 'HALF_WIN' ? 'default' : a.resultado === 'LOSS' || a.resultado === 'HALF_LOSS' ? 'destructive' : 'secondary'} className="text-[10px]">{ROTULO_RESULTADO[a.resultado] ?? a.resultado}</Badge></TableCell>
                    <TableCell className={corSinal(a.pnl)}>{sinal(a.pnl)}</TableCell>
                    <TableCell className={corSinal(a.clvNovig)}>{pct(a.clvNovig, 1)}</TableCell>
                    <TableCell>{num(a.banco)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="comparar">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Guarde até 5 resultados para comparar lado a lado.</p>
            <Button size="sm" variant="secondary" disabled={comparados.length >= 5} onClick={onGuardar}>Guardar este resultado</Button>
          </div>
          {comparados.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Run</TableHead><TableHead>n</TableHead><TableHead>Yield</TableHead><TableHead>Lucro</TableHead><TableHead>Acerto</TableHead><TableHead>MDD</TableHead><TableHead>CLV</TableHead><TableHead>Bateu fech.</TableHead><TableHead>p</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>{comparados.map((r, i) => <TableRow key={i}><TableCell><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: r.cor }} />{r.rotulo}</TableCell><TableCell>{r.run.kpis.n}</TableCell><TableCell className={corSinal(r.run.kpis.yield)}>{pct(r.run.kpis.yield)}</TableCell><TableCell>{sinal(r.run.kpis.lucro)}</TableCell><TableCell>{pct(r.run.kpis.hitRate)}</TableCell><TableCell>{num(r.run.caminho.mdd)}</TableCell><TableCell className={corSinal(r.run.clv.clvNovigMedio)}>{pct(r.run.clv.clvNovigMedio)}</TableCell><TableCell>{pct(r.run.clv.beatRate)}</TableCell><TableCell>{num(r.run.inferencia.pValor, 3)}</TableCell><TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoverComparado(i)}><Trash2 className="w-3 h-3" /></Button></TableCell></TableRow>)}</TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      <p className="text-[10px] text-muted-foreground">dataset {run.datasetVersao} · catálogo {run.catalogoVersao} · engine {run.engineVersao} · hash {run.hash} · {run.tempoMs} ms</p>
    </div>
  )
}

function Segmentos({ run }: { run: RunUI }) {
  const dims = Object.keys(run.segmentos).filter((d) => d !== 'mes')
  const [dim, setDim] = useState(dims[0] ?? 'competicao')
  const rotulos: Record<string, string> = { competicao: 'Competição', temporada: 'Temporada', odd: 'Faixa de odd', mercado: 'Mercado', entrada: 'Aposta', selecao: 'Seleção', favorito: 'Favorito / zebra', ev: 'Faixa de EV', clv: 'Faixa de CLV' }
  const segs = run.segmentos[dim] ?? []
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">{dims.map((d) => <Button key={d} size="sm" variant={d === dim ? 'default' : 'outline'} className="h-7 text-xs" onClick={() => setDim(d)}>{rotulos[d] ?? d}</Button>)}</div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <Table>
          <TableHeader><TableRow><TableHead>{rotulos[dim] ?? dim}</TableHead><TableHead>n</TableHead><TableHead>Yield</TableHead><TableHead>Lucro</TableHead><TableHead>Acerto</TableHead><TableHead>Odd</TableHead><TableHead>CLV</TableHead></TableRow></TableHeader>
          <TableBody>{segs.map((s) => <TableRow key={s.chave}><TableCell className="text-xs">{s.chave}</TableCell><TableCell>{s.n}</TableCell><TableCell className={corSinal(s.yield)}>{pct(s.yield)}</TableCell><TableCell>{sinal(s.lucro)}</TableCell><TableCell>{pct(s.hitRate)}</TableCell><TableCell>{num(s.oddMedia)}</TableCell><TableCell className={corSinal(s.clvNovigMedio)}>{pct(s.clvNovigMedio)}</TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
    </div>
  )
}
