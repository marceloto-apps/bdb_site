/**
 * Paridade Fase 2: estratégia "1X2 mandante, flat 1u, bet365 fechamento" numa competição×temporada,
 * calculada (a) como o backtest atual faz — `matches` FINISHED + `MatchOdds` PREMATCH_CLOSING,
 * bet365 preferida, `liquidarAposta` — e (b) pelo engine novo sobre os chunks da feature store.
 *
 *   npx tsx scripts/laboratorio/paridade-backtest.ts --comp=serie-a --ano=2025 --dir=<pasta dos chunks> [--versao=X]
 *
 * Diferenças esperadas: a feature store prefere a odd Flashscore (bdbs_odds_snapshot) à do MatchOdds
 * quando as duas existem; jogos com placar corrigido pela FPT. O script lista cada divergência.
 */
import { config } from 'dotenv'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { prisma } from '../../lib/prisma'
import { liquidarAposta } from '../../lib/ferramentas/backtest/settlement'
import { carregarDataset, filtroDoUniverso, infoCompeticoes, type Manifest } from '../../lib/laboratorio/data/dataset'
import { catalogoPadrao } from '../../lib/laboratorio/engine/catalogo'
import { prepararEstrategia } from '../../lib/laboratorio/engine/estrategia'
import { executarCompilada } from '../../lib/laboratorio/engine/run'
import type { Estrategia } from '../../lib/laboratorio/engine/tipos'

config({ path: resolve(process.cwd(), '.env.local') }); config({ path: resolve(process.cwd(), '.env') })
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=')

async function main() {
  const slug = arg('comp') ?? 'serie-a', ano = arg('ano') ?? '2025', dir = arg('dir')
  if (!dir) throw new Error('--dir obrigatório')
  const comp = await prisma.competition.findUnique({ where: { slug }, select: { id: true, name: true } })
  if (!comp) throw new Error(`competição ${slug} não existe`)

  // (a) backtest atual
  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED', season: { competitionId: comp.id, year: ano, competition: { type: 'LEAGUE' } } },
    include: { odds: { where: { oddsType: 'PREMATCH_CLOSING' }, include: { market: true, bookmaker: true } }, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
    orderBy: { utcDate: 'asc' },
  })
  const legado = new Map<string, { odd: number; pnl: number; outcome: string; bookmaker: string; source: string; home: string; away: string; fthg: number; ftag: number; date: string }>()
  let semOdd = 0
  for (const m of matches) {
    const cands = m.odds.filter((o) => ['match_odds', '1x2'].includes(o.market.key) && o.selection.toLowerCase() === 'home')
    if (!cands.length || m.fthg === null || m.ftag === null) { semOdd++; continue }
    const o = cands.find((c) => c.bookmaker.slug === 'bet365' || c.bookmaker.name.toLowerCase() === 'bet365') ?? cands[0]
    const r = liquidarAposta({ market: '1X2', betSide: 'HOME', stake: 1, odd: o.odds, fthg: m.fthg, ftag: m.ftag })
    legado.set(m.id, { odd: o.odds, pnl: r.pnl, outcome: r.outcome, bookmaker: o.bookmaker.slug, source: o.source, home: m.homeTeam.name, away: m.awayTeam.name, fthg: m.fthg, ftag: m.ftag, date: m.utcDate.toISOString().slice(0, 10) })
  }

  // (b) engine novo
  const versao = arg('versao') ?? (JSON.parse(await readFile(join(dir, 'latest.json'), 'utf-8')) as { versao: string }).versao
  const manifest = JSON.parse(await readFile(join(dir, versao, 'manifest.json'), 'utf-8')) as Manifest
  const estrategia: Estrategia = { versao: 1, universo: { competicoes: [comp.id], temporadasLabel: [ano], fontes: ['core'] }, entradas: [{ mercado: '1x2', selecao: 'home', preco: { casa: 'bet365', snapshot: 'close' } }], staking: { metodo: 'flat', unidade: 1 }, bootstrap: 0 }
  const cat = catalogoPadrao()
  const ec = prepararEstrategia(estrategia, cat)
  const carga = await carregarDataset({ manifest, campos: [...ec.camposUsados, 'match.odds_close_src'], filtro: filtroDoUniverso(estrategia.universo, manifest), buscar: async (k) => new Uint8Array(await readFile(join(dir, ...k.split('/')))) })
  const { info, nomes } = infoCompeticoes(manifest)
  const r = executarCompilada(ec, carga.dataset, { catalogo: cat, competicoesInfo: info, nomesCompeticoes: nomes, nomesTimes: new Map(Object.entries(manifest.times)) })
  const src = carga.dataset.textos.get('match.odds_close_src')

  // comparação
  let iguais = 0, oddDiferente = 0, soNovo = 0, soLegado = 0, pnlLegado = 0, pnlNovo = 0, pnlComum = { legado: 0, novo: 0 }, resultadoDiferente = 0
  const divPorSource = new Map<string, number>()
  const difs: string[] = []
  const vistos = new Set<string>()
  for (const a of r.apostas) {
    vistos.add(a.matchId)
    pnlNovo += a.pnl
    const l = legado.get(a.matchId)
    if (!l) { soNovo++; continue }
    pnlComum.legado += l.pnl; pnlComum.novo += a.pnl
    if (Math.abs(l.odd - a.odd) < 1e-9 && Math.abs(l.pnl - a.pnl) < 1e-4) iguais++
    else { oddDiferente++; divPorSource.set(l.source, (divPorSource.get(l.source) ?? 0) + 1); if (l.outcome !== a.resultado) resultadoDiferente++; if (difs.length < 15) difs.push(`  ${l.date} ${l.home} × ${l.away} ${l.fthg}-${l.ftag}: legado ${l.odd} (${l.bookmaker}) pnl ${l.pnl} | novo ${a.odd} (${src?.[a.i] ?? '?'}) pnl ${a.pnl.toFixed(4)} ${a.resultado}`) }
  }
  for (const [id, l] of Array.from(legado)) { pnlLegado += l.pnl; if (!vistos.has(id)) { soLegado++; if (difs.length < 25) difs.push(`  só no legado: ${l.date} ${l.home} × ${l.away} @ ${l.odd} (${l.bookmaker})`) } }
  const soNovoLista = r.apostas.filter((a) => !legado.has(a.matchId)).slice(0, 5).map((a) => `  só no novo: ${new Date(a.data).toISOString().slice(0, 10)} ${a.home} × ${a.away} @ ${a.odd} (${src?.[a.i] ?? '?'})`)

  console.log(`\n${comp.name} ${ano} — 1X2 mandante flat 1u, bet365 fechamento`)
  console.log(`Legado: ${matches.length} jogos FINISHED, ${legado.size} com odd (${semOdd} sem odd/placar), P&L ${pnlLegado.toFixed(2)}`)
  console.log(`Novo:   ${r.nUniverso} jogos no universo, ${r.nApostas} apostas, P&L ${pnlNovo.toFixed(2)} (yield ${(r.kpis.yield * 100).toFixed(2)}%)`)
  console.log(`Em comum: ${iguais + oddDiferente} jogos · idênticos (odd e P&L): ${iguais} (${((iguais / (iguais + oddDiferente)) * 100).toFixed(1)}%) · odd diferente: ${oddDiferente} · P&L nos jogos em comum: legado ${pnlComum.legado.toFixed(2)} × novo ${pnlComum.novo.toFixed(2)}`)
  console.log(`Só no novo: ${soNovo} · só no legado: ${soLegado} · resultado (W/L) diferente: ${resultadoDiferente} · divergências por fonte do MatchOdds legado: ${JSON.stringify(Object.fromEntries(divPorSource))}`)
  if (difs.length) { console.log('Divergências (amostra):'); for (const d of difs) console.log(d) }
  for (const s of soNovoLista) console.log(s)
  const porSrc = new Map<string, number>()
  for (const a of r.apostas) { const k = src?.[a.i] ?? 'null'; porSrc.set(k, (porSrc.get(k) ?? 0) + 1) }
  console.log('Fonte da odd de fechamento no novo:', JSON.stringify(Object.fromEntries(porSrc)))
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
