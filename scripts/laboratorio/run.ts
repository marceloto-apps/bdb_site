/**
 * CLI do engine do Backtest Livre (Fase 2):
 *
 *   npm run lab:run -- estrategia.json                       # dataset do R2 (latest), via token do site
 *   npm run lab:run -- estrategia.json --dir=C:/dados/lab    # chunks locais (LAB_OUT_DIR do bdb_ingest)
 *   npm run lab:run -- estrategia.json --versao=20260925-2031 --apostas=20 --json=saida.json --csv=apostas.csv
 *
 * Carrega só os grupos/colunas que a estratégia referencia e imprime o tearsheet resumido.
 */
import { config } from 'dotenv'
import { readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { carregarDataset, filtroDoUniverso, infoCompeticoes, resolverAliases, type Buscador, type Manifest } from '../../lib/laboratorio/data/dataset'
import { catalogoPadrao } from '../../lib/laboratorio/engine/catalogo'
import { ErroEstrategia, prepararEstrategia } from '../../lib/laboratorio/engine/estrategia'
import { executarCompilada, serializarRun } from '../../lib/laboratorio/engine/run'
import type { Estrategia, RunResult } from '../../lib/laboratorio/engine/tipos'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=')
const flag = (n: string) => process.argv.includes(`--${n}`)

async function buscadorLocal(dir: string): Promise<{ buscar: Buscador; latest: () => Promise<string> }> {
  return {
    buscar: async (chave) => new Uint8Array(await readFile(join(dir, ...chave.split('/')))),
    latest: async () => (JSON.parse(await readFile(join(dir, 'latest.json'), 'utf-8')) as { versao: string }).versao,
  }
}

async function buscadorR2(): Promise<{ buscar: Buscador; latest: () => Promise<string> }> {
  const r2 = await import('../../lib/laboratorio/data/r2')
  if (!r2.r2Configurado()) throw new Error('R2 não configurado (.env.local) — use --dir=<pasta com latest.json>')
  // mesmo caminho da rota /api/laboratorio/run: GetObject direto (sem URL assinada)
  return { buscar: r2.buscadorR2, latest: async () => (await r2.lerLatest()).versao }
}

const f = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : x === Infinity ? '∞' : '—')
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(2)}%` : '—')

function imprimir(r: RunResult, nApostas: number) {
  const k = r.kpis, c = r.caminho, v = r.clv, inf = r.inferencia
  console.log(`\nDataset ${r.datasetVersao} · catálogo ${r.catalogoVersao} · engine ${r.engineVersao} · hash ${r.hash} · ${r.tempoMs} ms`)
  console.log(`Universo ${r.nUniverso} jogos · selecionados ${r.nSelecionados} · apostas ${r.nApostas}`)
  console.log(`\nResultado: n ${k.n} · turnover ${f(k.turnover)} · lucro ${f(k.lucro)} · yield ${pct(k.yield)} · ROI banco ${pct(k.roiBanco)} · lucro flat ${f(k.lucroFlat)} (${pct(k.yieldFlat)})`)
  console.log(`  hit ${pct(k.hitRate)} (break-even ${pct(k.breakEvenHit)}) · odd média ${f(k.oddMedia)} / pond. ${f(k.oddMediaPonderada)} · W ${k.wins} HW ${k.halfWins} R ${k.refunds} HL ${k.halfLosses} L ${k.losses} V ${k.voids} · PF ${f(k.profitFactor)} · payoff ${f(k.payoff)}`)
  console.log(`Risco: MDD ${f(c.mdd)} (${pct(c.mddPct)}) dur ${c.mddDuracao} rec ${c.mddRecuperacao ?? '—'} · seq. derrotas ${c.maiorSequenciaDerrotas} · sem novo máximo ${c.maiorSemNovoMaximo} · Sharpe ${f(c.sharpe, 3)} · Sortino ${f(c.sortino, 3)} · Calmar ${f(c.calmar, 3)}`)
  console.log(`CLV (${v.nComRef} com ref., ${pct(v.refSoft)} soft): EV médio ${pct(v.evMedio)} · yield esperado ${pct(v.yieldEsperado)} · CLV bruto ${pct(v.clvBrutoMedio)} · no-vig ${pct(v.clvNovigMedio)} · pontos ${pct(v.clvPontosMedio)} · beat ${pct(v.beatRate)} · t ${f(v.tClv)}`)
  console.log(`Inferência: margem ${pct(inf.margemMedia)} · t ${f(inf.tYield)} · p ${f(inf.pValor, 4)} · z Buchdahl ${f(inf.zBuchdahl)} · n mín. ${Number.isFinite(inf.nMinimo) ? inf.nMinimo : '∞'} · IC95 yield ${inf.ic95Yield ? `[${pct(inf.ic95Yield[0])}, ${pct(inf.ic95Yield[1])}]` : '—'} · IC95 MDD ${inf.ic95Mdd ? `[${f(inf.ic95Mdd[0])}, ${f(inf.ic95Mdd[1])}]` : '—'} (${inf.reamostras} reamostras)`)
  for (const dim of ['competicao', 'temporada', 'odd']) {
    const segs = r.segmentos[dim] ?? []
    if (!segs.length) continue
    console.log(`\nPor ${dim}:`)
    for (const s of segs.slice(0, 12)) console.log(`  ${s.chave.padEnd(34)} n ${String(s.n).padStart(5)} · yield ${pct(s.yield).padStart(8)} · lucro ${f(s.lucro).padStart(9)} · hit ${pct(s.hitRate).padStart(7)} · CLV ${pct(s.clvNovigMedio).padStart(7)}`)
  }
  if (nApostas > 0 && r.apostas.length) {
    console.log(`\nPrimeiras ${Math.min(nApostas, r.apostas.length)} apostas:`)
    for (const a of r.apostas.slice(0, nApostas)) console.log(`  ${new Date(a.data).toISOString().slice(0, 10)} ${a.home} × ${a.away} · ${a.mercado} ${a.selecao}${a.linha !== null ? ` ${a.linha}` : ''} @ ${f(a.odd)} · stake ${f(a.stake)} · ${a.resultado} ${f(a.pnl)} · CLV ${pct(a.clvNovig)}`)
  }
  if (r.avisos.length) { console.log('\nAvisos:'); for (const a of r.avisos) console.log(`  [${a.tipo}] ${a.mensagem}`) }
}

function csvApostas(r: RunResult): string {
  const extras = new Set<string>()
  for (const a of r.apostas) for (const k of Object.keys(a.extras ?? {})) extras.add(k)
  const cols = ['data', 'competicao', 'temporada', 'home', 'away', 'entrada', 'mercado', 'selecao', 'linha', 'odd', 'oddLiquidacao', 'stake', 'resultado', 'pnl', 'banco', 'qRef', 'oddRef', 'refSrc', 'ev', 'clvBruto', 'clvNovig', 'clvPontos', ...Array.from(extras)]
  const esc = (v: unknown) => { const s = v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const linhas = [cols.join(',')]
  for (const a of r.apostas) {
    const base: Record<string, unknown> = { data: new Date(a.data).toISOString(), competicao: a.competicao, temporada: a.temporada, home: a.home, away: a.away, entrada: a.entradaId, mercado: a.mercado, selecao: a.selecao, linha: a.linha, odd: a.odd, oddLiquidacao: a.oddLiquidacao, stake: a.stake, resultado: a.resultado, pnl: a.pnl, banco: a.banco, qRef: a.qRef, oddRef: a.oddRef, refSrc: a.refSrc, ev: a.ev, clvBruto: a.clvBruto, clvNovig: a.clvNovig, clvPontos: a.clvPontos, ...(a.extras ?? {}) }
    linhas.push(cols.map((c) => esc(base[c])).join(','))
  }
  return linhas.join('\n')
}

async function main() {
  const arquivo = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!arquivo) { console.error('Uso: npm run lab:run -- estrategia.json [--dir=pasta] [--versao=X] [--apostas=N] [--json=saida.json] [--csv=apostas.csv] [--bootstrap=N] [--sem-extras]'); process.exit(2) }
  const estrategia = JSON.parse(await readFile(arquivo, 'utf-8')) as Estrategia
  const cat = catalogoPadrao()
  let ec
  try { ec = prepararEstrategia(estrategia, cat) } catch (e) {
    if (e instanceof ErroEstrategia) { console.error('Estratégia inválida:\n  ' + e.erros.join('\n  ')); process.exit(1) }
    throw e
  }
  console.log(`Estratégia "${estrategia.nome ?? arquivo}": ${ec.indicadores.length} indicador(es), ${ec.entradas.length} entrada(s), ${ec.camposUsados.length} campos`)

  const dir = arg('dir')
  const fonte = dir ? await buscadorLocal(dir) : await buscadorR2()
  const versao = arg('versao') ?? (await fonte.latest())
  const manifest = JSON.parse(new TextDecoder().decode(await fonte.buscar(`${versao}/manifest.json`))) as Manifest
  const universo = resolverAliases(estrategia.universo, manifest)
  const t0 = Date.now()
  const carga = await carregarDataset({ manifest, campos: ec.camposUsados, filtro: filtroDoUniverso(universo, manifest), buscar: fonte.buscar, paralelo: 8 })
  console.log(`Dataset ${versao}: ${carga.chunks} chunks, ${carga.dataset.n} linhas, ${(carga.bytes / 1048576).toFixed(1)} MB em ${Date.now() - t0} ms${carga.camposAusentes.length ? ` · sem dados: ${carga.camposAusentes.join(', ')}` : ''}`)

  const { info, nomes } = infoCompeticoes(manifest)
  const nomesTimes = new Map(Object.entries(manifest.times ?? {}))
  const r = executarCompilada({ ...ec, estrategia: { ...estrategia, universo } }, carga.dataset, {
    catalogo: cat, competicoesInfo: info, nomesCompeticoes: nomes, nomesTimes, extras: !flag('sem-extras'),
    bootstrap: arg('bootstrap') ? Number(arg('bootstrap')) : undefined,
  })
  imprimir(r, Number(arg('apostas') ?? 10))
  const json = arg('json')
  if (json) { await writeFile(json, JSON.stringify(serializarRun(r), null, 1)); console.log(`\nResultado gravado em ${json}`) }
  const csv = arg('csv')
  if (csv) { await writeFile(csv, csvApostas(r)); console.log(`Apostas gravadas em ${csv}`) }
}

main().catch((e) => { console.error(e); process.exit(1) })
