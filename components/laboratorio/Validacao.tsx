'use client'
/** Abas do tearsheet da Fase 5: Validação (holdout, folds, walk-forward), Monte Carlo, Varredura, Calibração. */
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Lock, Play, Unlock } from 'lucide-react'
import { corSinal, dataCurta, inteiro, num, pct, sinal } from '@/lib/laboratorio/ui/formato'
import { DICAS } from '@/lib/laboratorio/ui/rotulos'
import type { ValidacaoUI } from '@/lib/laboratorio/ui/tipos'
import { Dica } from './Dica'

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

export function BotaoValidar({ executando, onRodar, texto = 'Rodar validação avançada' }: { executando: boolean; onRodar: () => void; texto?: string }) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 text-center bg-card border border-dashed border-border rounded-xl p-6">
      <p className="text-sm text-muted-foreground max-w-md">Holdout, cortes no tempo, walk-forward, varredura de parâmetros, Monte Carlo e calibração rodam num passo à parte, sobre o mesmo run.</p>
      <Button size="sm" disabled={executando} onClick={onRodar}><Play className="w-3 h-3 mr-1" />{texto}</Button>
    </div>
  )
}

const linhaFold = (f: NonNullable<ValidacaoUI['holdout']['holdout']>, rotulo?: string) => (
  <TableRow key={rotulo ?? f.chave}>
    <TableCell className="text-xs whitespace-nowrap">{rotulo ?? f.chave}<br /><span className="text-muted-foreground">{dataCurta(f.de)} – {dataCurta(f.ate)}</span></TableCell>
    <TableCell>{inteiro(f.n)}</TableCell><TableCell className={corSinal(f.yield)}>{pct(f.yield)}</TableCell><TableCell>{sinal(f.lucro)}</TableCell><TableCell>{pct(f.hitRate)}</TableCell><TableCell className={corSinal(f.clvNovigMedio)}>{pct(f.clvNovigMedio)}</TableCell><TableCell>{num(f.pValor, 3)}</TableCell>
  </TableRow>
)
const cabecalhoFold = (primeira: string) => (
  <TableHeader><TableRow><TableHead>{primeira}</TableHead><TableHead>n</TableHead><TableHead>Yield</TableHead><TableHead>Lucro</TableHead><TableHead>Acerto</TableHead><TableHead>CLV</TableHead><TableHead>p</TableHead></TableRow></TableHeader>
)

export function AbaValidacao({ v, seloAberto }: { v: ValidacaoUI; seloAberto: boolean }) {
  const h = v.holdout, f = v.folds, w = v.walkForward
  const serieOos = (w?.oosCumulativo ?? []).map((y, i) => ({ i, y: y ?? 0 }))
  return (
    <div className="space-y-4">
      <div className={`rounded-md border px-3 py-2 text-xs flex items-start gap-2 ${h.modo === 'selado' ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
        {h.modo === 'selado' ? <Lock className="w-4 h-4 text-primary shrink-0" /> : <Unlock className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div>
          {h.modo === 'selado' && <p><b>Última temporada selada{h.rotulos.length ? ` (${h.rotulos.join(', ')})` : ''}.</b> {h.jogosOcultos !== null ? `${inteiro(h.jogosOcultos)} jogos de ${h.temporadas} competições ficaram de fora deste run.` : `${h.temporadas} temporadas ficaram de fora.`} Abra o selo no passo 6 quando a estratégia estiver pronta.</p>}
          {h.modo === 'aberto' && <p><b>Selo aberto{h.rotulos.length ? ` (${h.rotulos.join(', ')})` : ''}.</b> A última temporada de cada liga entrou no run e aparece separada abaixo{seloAberto ? '' : ' (esta estratégia não está salva; o registro do selo só vale para estratégias salvas)'}.</p>}
          {h.modo === 'nenhum' && <p>Sem holdout configurado.</p>}
        </div>
      </div>
      {h.modo === 'aberto' && h.anteriores && h.holdout && (
        <div className="overflow-x-auto">
          <Table>{cabecalhoFold('Período')}<TableBody>{linhaFold(h.anteriores, 'Temporadas anteriores')}{linhaFold(h.holdout, 'Última temporada (holdout)')}</TableBody></Table>
          {(h.holdout.n ?? 0) > 0 && h.anteriores.yield !== null && h.holdout.yield !== null && (
            <p className="text-xs text-muted-foreground mt-1">{h.holdout.yield >= 0 && h.holdout.clvNovigMedio !== null && h.holdout.clvNovigMedio > 0 ? 'A última temporada confirma: yield e CLV positivos fora da amostra usada para ajustar.' : h.holdout.yield < 0 ? 'A última temporada não confirma o resultado anterior: cuidado com ajuste excessivo.' : 'Resultado misto na última temporada; olhe o CLV e o tamanho da amostra.'}</p>
          )}
        </div>
      )}

      <div>
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">Cortes {f.tipo === 'ano' ? 'por ano' : 'por temporada'}<Dica texto={DICAS.folds} /><Badge variant="secondary" className="ml-2">{f.positivos} de {f.total} com lucro</Badge></p>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <Table>{cabecalhoFold(f.tipo === 'ano' ? 'Ano' : 'Temporada')}<TableBody>{f.itens.map((x) => linhaFold(x))}</TableBody></Table>
        </div>
      </div>

      {w && (
        <div>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">Walk-forward {w.otimizado ? '(parâmetros escolhidos no treino)' : '(estabilidade no tempo)'}<Dica texto={DICAS.walkForward} /></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <Card titulo="Yield fora da amostra" valor={pct(w.yieldOos)} sub={`${inteiro(w.nOos)} apostas · lucro ${sinal(w.lucroOos)} u`} cor={corSinal(w.yieldOos)} dica="Só as janelas de teste, concatenadas: é o número que vale." />
            <Card titulo="Yield no treino" valor={pct(w.yieldIs)} sub="média ponderada das janelas de treino" />
            <Card titulo="Eficiência (WFE)" valor={w.wfe === null ? '—' : num(w.wfe, 2)} sub={w.wfe === null ? 'sem treino positivo' : w.wfe >= 0.5 ? 'boa: fora da amostra mantém ≥ 50% do treino' : w.wfe > 0 ? 'fraca: fora da amostra bem abaixo do treino' : 'negativa: perde fora da amostra'} cor={w.wfe === null ? '' : w.wfe >= 0.5 ? 'text-primary' : 'text-data-red'} dica={DICAS.wfe} />
            <Card titulo="Janelas" valor={String(w.janelas.length)} sub={w.expandindo ? 'treino expansivo' : 'treino = janela anterior'} />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Teste</TableHead>{w.otimizado && <TableHead>Parâmetros</TableHead>}<TableHead>n treino</TableHead><TableHead>Yield treino</TableHead><TableHead>n teste</TableHead><TableHead>Yield teste</TableHead><TableHead>Lucro teste</TableHead><TableHead>CLV teste</TableHead></TableRow></TableHeader>
              <TableBody>{w.janelas.map((j) => <TableRow key={j.k}><TableCell className="text-xs whitespace-nowrap">{dataCurta(j.de)} – {dataCurta(j.ate)}</TableCell>{w.otimizado && <TableCell className="font-mono text-xs">{j.parametros ? Object.entries(j.parametros).map(([k, x]) => `${k}=${x}`).join(' ') : '—'}</TableCell>}<TableCell>{inteiro(j.nTreino)}</TableCell><TableCell className={corSinal(j.yieldTreino)}>{pct(j.yieldTreino)}</TableCell><TableCell>{inteiro(j.nTeste)}</TableCell><TableCell className={corSinal(j.yieldTeste)}>{pct(j.yieldTeste)}</TableCell><TableCell>{sinal(j.lucroTeste)}</TableCell><TableCell className={corSinal(j.clvTeste)}>{pct(j.clvTeste)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
          {serieOos.length > 1 && (
            <div className="h-[160px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serieOos}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="i" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(i) => String(Number(i) + 1)} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={TOOLTIP} formatter={(val) => [num(Number(val)), 'Lucro fora da amostra']} labelFormatter={(i) => `Aposta ${Number(i) + 1}`} />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" />
                  <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AbaMonteCarlo({ v }: { v: ValidacaoUI }) {
  const mc = v.monteCarlo
  if (!mc) return <p className="text-xs text-muted-foreground">Monte Carlo precisa de pelo menos 10 apostas.</p>
  const hist = mc.histograma.map((b) => ({ x: `${num(b.de, 0)}`, n: b.n, de: b.de }))
  const maxLen = Math.max(...mc.amostras.map((a) => a.length))
  const caminhos = Array.from({ length: maxLen }, (_, i) => { const p: Record<string, number> = { i }; mc.amostras.forEach((a, k) => { const y = a[i]; if (y !== undefined && y !== null) p[`s${k}`] = y }); return p })
  const sa = mc.selecaoAleatoria
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card titulo="Lucro final (mediana)" valor={`${sinal(mc.lucroFinal.p50)} u`} sub={`5%: ${sinal(mc.lucroFinal.p5)} · 95%: ${sinal(mc.lucroFinal.p95)}`} cor={corSinal(mc.lucroFinal.p50)} dica="Refazendo as mesmas apostas em ordem sorteada, com o stake escolhido." />
        <Card titulo="Chance de lucro" valor={pct(mc.probLucro, 0)} sub={`${inteiro(mc.caminhos)} caminhos · ${inteiro(mc.n)} apostas`} cor={mc.probLucro !== null && mc.probLucro >= 0.8 ? 'text-primary' : ''} />
        <Card titulo="Maior queda típica" valor={`${num(mc.mdd.p50, 1)} u`} sub={`95%: ${num(mc.mdd.p95, 1)} · 99%: ${num(mc.mdd.p99, 1)}${mc.mddPct.p50 !== null ? ` · ${pct(mc.mddPct.p50, 0)} do banco` : ''}`} cor="text-data-red" dica="Mediana da maior queda entre os caminhos. O pior 5% chega ao valor P95." />
        <Card titulo="Chance de ruína" valor={pct(mc.probRuina, 1)} sub={`queda ≥ ${pct(mc.ruinaPct, 0)} do banco`} cor={mc.probRuina !== null && mc.probRuina > 0.05 ? 'text-data-red' : 'text-primary'} dica={DICAS.ruina} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Distribuição do lucro final (u)</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hist}>
                <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" fontSize={9} interval={3} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={TOOLTIP} formatter={(val) => [inteiro(Number(val)), 'caminhos']} labelFormatter={(x) => `lucro ≈ ${x} u`} />
                <Bar dataKey="n" isAnimationActive={false}>{hist.map((b, i) => <Cell key={i} fill={(b.de ?? 0) >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.7} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">12 caminhos sorteados (lucro acumulado)</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={caminhos}>
                <XAxis dataKey="i" hide /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                {mc.amostras.map((_, k) => <Line key={k} type="monotone" dataKey={`s${k}`} stroke="hsl(var(--primary))" strokeOpacity={0.45} strokeWidth={1} dot={false} isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 text-sm space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">Seleção aleatória nos mesmos jogos<Dica texto={DICAS.selecaoAleatoria} /></p>
        {sa ? <>
          <p>Yield real <b className={corSinal(sa.yieldReal)}>{pct(sa.yieldReal)}</b> · apostas sorteadas no mesmo universo: <b>{pct(sa.yieldMedio)}</b> ± {pct(sa.desvio)} ({inteiro(sa.sorteios)} sorteios)</p>
          <p>A regra fica <b className={sa.z !== null && sa.z >= 2 ? 'text-primary' : ''}>{num(sa.z, 2)} desvios</b> acima do sorteio · p = <b>{num(sa.pValor, 3)}</b>. {sa.z !== null && sa.z >= 2 ? 'A seleção escolhe jogos melhores que o acaso.' : sa.z !== null && sa.z >= 1 ? 'Indício de seleção, ainda fraco.' : 'Não é melhor que escolher jogos ao acaso.'}</p>
        </> : <p className="text-muted-foreground text-xs">Indisponível para este run.</p>}
      </div>
    </div>
  )
}

export function AbaVarredura({ v }: { v: ValidacaoUI }) {
  const s = v.varredura, d = v.deflacao
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card titulo="Tentativas" valor={inteiro(d.tentativas)} sub={`${inteiro(d.tentativasPrevias)} registradas + ${inteiro((d.tentativas ?? 0) - (d.tentativasPrevias ?? 0))} desta varredura`} dica={DICAS.tentativas} />
        <Card titulo="p-valor deflacionado" valor={num(d.pValorDeflacionado, 4)} sub={`original ${num(d.pValor, 4)}`} cor={d.pValorDeflacionado !== null && d.pValorDeflacionado < 0.05 ? 'text-primary' : 'text-data-red'} dica={DICAS.deflacao} />
        <Card titulo="t deflacionado" valor={num(d.tDeflacionado, 2)} sub={`original ${num(d.tYield, 2)} · máx. esperado por sorte ${num(d.tEsperadoMax, 2)}`} />
        <Card titulo="Veredito" valor={d.provavelSelecao ? 'Suspeito' : d.pValor !== null && d.pValor < 0.05 ? 'Sobrevive' : 'Não significativo'} sub={d.provavelSelecao ? 'significativo só antes de descontar as tentativas' : d.pValor !== null && d.pValor < 0.05 ? 'segue significativo após as tentativas' : 'já não era significativo'} cor={d.provavelSelecao ? 'text-data-yellow' : d.pValor !== null && d.pValor < 0.05 ? 'text-primary' : ''} />
      </div>
      {!s && <p className="text-xs text-muted-foreground">Sem varredura: defina parâmetros $p no passo 5 e faixas no passo 6 para ver o mapa de yield × n.</p>}
      {s && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Card titulo="Melhor combinação" valor={s.melhor ? Object.entries(s.melhor.parametros).map(([k, x]) => `${k}=${x}`).join(' ') : '—'} sub={s.melhor ? `yield ${pct(s.melhor.yield)} · n ${inteiro(s.melhor.n)}` : ''} />
            <Card titulo="PBO" valor={s.pbo === null ? '—' : pct(s.pbo, 0)} sub={s.pbo === null ? 'sem testes' : s.pbo >= 0.5 ? 'alta: a melhor no treino costuma decepcionar' : s.pbo > 0.25 ? 'moderada' : 'baixa: a escolha se sustenta fora da amostra'} cor={s.pbo === null ? '' : s.pbo >= 0.5 ? 'text-data-red' : s.pbo > 0.25 ? 'text-data-yellow' : 'text-primary'} dica={DICAS.pbo} />
            <Card titulo="Combinações" valor={inteiro(s.combos.length)} sub={`${s.parametros.map((p) => `$${p}`).join(' × ')}${s.truncada ? ' · truncada em 200' : ''}`} />
          </div>
          {s.heatmap && <Heatmap h={s.heatmap} px={s.parametros[0]} py={s.parametros[1]} />}
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <Table>
              <TableHeader><TableRow>{s.parametros.map((p) => <TableHead key={p} className="font-mono">${p}</TableHead>)}<TableHead>n</TableHead><TableHead>Yield</TableHead><TableHead>Lucro</TableHead><TableHead>Acerto</TableHead><TableHead>CLV</TableHead><TableHead>MDD</TableHead><TableHead>p</TableHead></TableRow></TableHeader>
              <TableBody>{s.combos.slice().sort((a, b) => (b.yield ?? -Infinity) - (a.yield ?? -Infinity)).map((c, i) => <TableRow key={i} className={c === s.melhor ? 'bg-primary/5' : ''}>{s.parametros.map((p) => <TableCell key={p} className="font-mono text-xs">{c.parametros[p]}</TableCell>)}<TableCell>{inteiro(c.n)}</TableCell><TableCell className={corSinal(c.yield)}>{pct(c.yield)}</TableCell><TableCell>{sinal(c.lucro)}</TableCell><TableCell>{pct(c.hitRate)}</TableCell><TableCell className={corSinal(c.clvNovigMedio)}>{pct(c.clvNovigMedio)}</TableCell><TableCell>{num(c.mdd, 1)}</TableCell><TableCell>{num(c.pValor, 3)}</TableCell></TableRow>)}</TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

function Heatmap({ h, px, py }: { h: NonNullable<NonNullable<ValidacaoUI['varredura']>['heatmap']>; px: string; py: string }) {
  const cor = (y: number | null) => (y === null ? '' : y > 0 ? `rgba(34,197,94,${Math.min(0.15 + Math.abs(y) * 4, 0.85)})` : `rgba(239,68,68,${Math.min(0.15 + Math.abs(y) * 4, 0.85)})`)
  return (
    <div className="overflow-x-auto">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Yield por combinação (linhas ${py} × colunas ${px}); passe o mouse para ver n</p>
      <table className="text-xs">
        <thead><tr><th className="p-1 text-left font-mono">${py} \ ${px}</th>{h.x.map((x) => <th key={x} className="p-1 font-mono">{x}</th>)}</tr></thead>
        <tbody>{h.y.map((y, iy) => <tr key={y}><td className="p-1 font-mono">{y}</td>{h.x.map((x, ix) => <td key={x} className="p-1 text-center rounded" style={{ background: cor(h.yield[iy][ix]) }} title={`n = ${h.n[iy][ix]}`}>{h.yield[iy][ix] === null ? '—' : pct(h.yield[iy][ix], 1)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

export function AbaCalibracao({ v }: { v: ValidacaoUI }) {
  const c = v.calibracao
  if (!c) return <p className="text-xs text-muted-foreground">Sem probabilidade para calibrar. No passo 6, em “Calibração: probabilidade estimada”, informe a expressão que a estratégia usa como probabilidade (ex.: <span className="font-mono">model(DC, FORCAS, l10).p_over(2.5)</span>) e rode a validação de novo. Com stake Kelly, a probabilidade do stake é usada automaticamente.</p>
  if ((c.n ?? 0) < 10) return <p className="text-xs text-muted-foreground">Poucas apostas com probabilidade e referência ({c.n}).</p>
  const pontos = c.bins.map((b) => ({ x: b.pMedio, y: b.freq, n: b.n }))
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Probabilidade avaliada: <span className="font-mono text-primary">{c.formula}</span> · {inteiro(c.n)} apostas decididas com referência</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card titulo="Brier" valor={num(c.brier, 4)} sub={`referência (Pinnacle) ${num(c.brierRef, 4)}`} cor={c.brier !== null && c.brierRef !== null && c.brier < c.brierRef ? 'text-primary' : ''} dica={DICAS.brier} />
        <Card titulo="Skill vs. referência" valor={pct(c.skill, 1)} sub={c.skill !== null && c.skill > 0 ? 'melhor que o fechamento da Pinnacle' : 'pior que o fechamento da Pinnacle'} cor={c.skill !== null && c.skill > 0 ? 'text-primary' : 'text-data-red'} dica="1 − Brier/Brier da referência. Positivo = prevê melhor que o mercado." />
        <Card titulo="Log-loss" valor={num(c.logLoss, 4)} sub={`referência ${num(c.logLossRef, 4)}`} />
        <Card titulo="ECE" valor={pct(c.ece, 1)} sub={c.ece !== null && c.ece < 0.03 ? 'bem calibrada' : c.ece !== null && c.ece < 0.07 ? 'calibração razoável' : 'descalibrada'} cor={c.ece !== null && c.ece < 0.03 ? 'text-primary' : c.ece !== null && c.ece < 0.07 ? 'text-data-yellow' : 'text-data-red'} dica={DICAS.ece} />
      </div>
      <div className="bg-card border border-border rounded-xl p-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Diagrama de confiabilidade (prevista × observada)</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis type="number" dataKey="x" domain={[0, 1]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(x) => pct(Number(x), 0)} name="prevista" />
              <YAxis type="number" dataKey="y" domain={[0, 1]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(y) => pct(Number(y), 0)} name="observada" />
              <Tooltip contentStyle={TOOLTIP} formatter={(val, nome) => [pct(Number(val)), nome === 'x' ? 'prevista' : nome === 'y' ? 'observada' : nome]} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
              <Scatter data={pontos} fill="hsl(var(--primary))" isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="overflow-x-auto mt-2">
          <Table><TableHeader><TableRow><TableHead>Faixa (prevista média)</TableHead><TableHead>Observada</TableHead><TableHead>n</TableHead><TableHead>Diferença</TableHead></TableRow></TableHeader>
            <TableBody>{c.bins.map((b, i) => <TableRow key={i}><TableCell>{pct(b.pMedio, 1)}</TableCell><TableCell>{pct(b.freq, 1)}</TableCell><TableCell>{inteiro(b.n)}</TableCell><TableCell className={corSinal(b.freq !== null && b.pMedio !== null ? b.freq - b.pMedio : null)}>{b.freq !== null && b.pMedio !== null ? pct(b.freq - b.pMedio, 1) : '—'}</TableCell></TableRow>)}</TableBody></Table>
        </div>
      </div>
    </div>
  )
}
