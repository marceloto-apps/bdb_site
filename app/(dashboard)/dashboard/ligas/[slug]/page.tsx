import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { calcularMediasLiga } from '@/lib/analytics'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'
import { DashboardLigaClient } from './DashboardLigaClient'
import { auth } from '@/auth'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const liga = await prisma.competition.findUnique({
    where: { slug: params.slug },
  })
  
  if (!liga) return { title: 'Liga não encontrada' }
  
  return { title: `${liga.name} — Análise BDB` }
}

export default async function LigaDashboardPage({ params }: { params: { slug: string } }) {
  const session = await auth()
  const slug = params.slug

  const freeSlugs = [
    'brasileirao-serie-a',
    'brasileirao-serie-b',
    'premier-league',
    'la-liga',
    'serie-a',
    'division-profesional'
  ]
  const isPremium = (session?.user as any)?.plan === 'PREMIUM'

  if (!freeSlugs.includes(slug) && !isPremium) {
    redirect('/planos')
  }

  const liga = await prisma.competition.findUnique({
    where: { slug },
    include: {
      seasons: {
        where: { isCurrent: true },
        include: {
          teamSeasons: {
            include: { team: { select: { id: true, name: true, shortName: true, logoUrl: true } } }
          }
        }
      }
    }
  })

  if (!liga) notFound()

  const activeSeason = liga.seasons[0]
  if (!activeSeason) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Temporada não encontrada</h1>
        <p className="text-muted-foreground">Não há temporada ativa para esta liga no momento.</p>
      </div>
    )
  }

  // Buscar partidas finalizadas da temporada ATUAL (filtro por ano)
  const partidas = await prisma.match.findMany({
    where: {
      seasonId: activeSeason.id,
      status: 'FINISHED',
      fthg: { not: null },
      ftag: { not: null },
      utcDate: getSeasonDateFilter(activeSeason.year),
    },
    include: {
      homeTeam: { select: { id: true, name: true, shortName: true } },
      awayTeam: { select: { id: true, name: true, shortName: true } },
      stats: {
        select: {
          homeXg: true,
          awayXg: true,
          homeCorners: true,
          awayCorners: true,
          homeYellowCards: true,
          awayYellowCards: true,
          homeRedCards: true,
          awayRedCards: true,
        }
      }
    },
    orderBy: { utcDate: 'asc' }
  })

  // Calcular médias da liga server-side
  const jogosParaCalculo = partidas.map(p => ({ fthg: p.fthg!, ftag: p.ftag! }))
  const mediasLiga = jogosParaCalculo.length >= 20
    ? calcularMediasLiga(jogosParaCalculo as any)
    : null

  // Montar lista de times a partir das partidas da temporada atual
  // (não usar teamSeasons pois pode conter times de temporadas anteriores)
  const timesMap = new Map<string, { id: string; name: string; shortName: string | null; logoUrl: string | null }>()
  partidas.forEach(p => {
    if (!timesMap.has(p.homeTeam.id)) {
      timesMap.set(p.homeTeam.id, { id: p.homeTeam.id, name: p.homeTeam.name, shortName: p.homeTeam.shortName, logoUrl: null })
    }
    if (!timesMap.has(p.awayTeam.id)) {
      timesMap.set(p.awayTeam.id, { id: p.awayTeam.id, name: p.awayTeam.name, shortName: p.awayTeam.shortName, logoUrl: null })
    }
  })
  const times = Array.from(timesMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  // Calcular rodada máxima
  const maxRodada = Math.max(...partidas.map(p => p.round ?? 0), 1)

  // Serializar partidas para client (Date -> string)
  const partidasIniciais = partidas.map(p => ({
    round: p.round,
    utcDate: p.utcDate.toISOString(),
    homeTeamId: p.homeTeamId,
    awayTeamId: p.awayTeamId,
    fthg: p.fthg!,
    ftag: p.ftag!,
    homeTeamName: p.homeTeam.name,
    awayTeamName: p.awayTeam.name,
    stats: p.stats ? {
      homeXg: p.stats.homeXg ?? null,
      awayXg: p.stats.awayXg ?? null,
      homeCorners: p.stats.homeCorners ?? null,
      awayCorners: p.stats.awayCorners ?? null,
      homeYellowCards: p.stats.homeYellowCards ?? null,
      awayYellowCards: p.stats.awayYellowCards ?? null,
      homeRedCards: p.stats.homeRedCards ?? null,
      awayRedCards: p.stats.awayRedCards ?? null,
    } : null
  }))

  const ligaSerializada = {
    id: liga.id,
    name: liga.name,
    slug: liga.slug,
    country: liga.country,
    logoUrl: (liga as any).logoUrl ?? null,
    temporada: activeSeason.year
  }

  return (
    <div className="p-4 md:p-8">
      <DashboardLigaClient
        liga={ligaSerializada}
        times={times}
        mediasLiga={mediasLiga}
        maxRodada={maxRodada}
        totalJogos={partidas.length}
        partidasIniciais={partidasIniciais}
      />
    </div>
  )
}
