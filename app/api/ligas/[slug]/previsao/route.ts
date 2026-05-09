import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { previsaoQuerySchema } from '@/lib/validations/liga'
import { getSeasonDateFilter } from '@/lib/utils/season-filter'
import {
  calcularMediasLiga,
  calcularMediasTime,
  calcularMediasTimeComDecay,
  calcularForcasTime,
  matrizPlacaresPoisson,
  matrizPlacaresZIP,
  matrizPlacaresNB,
  matrizPlacaresDixonColes,
  calcularMercados,
  estimarPiLiga,
  calcularVarianciaGols,
  estimarRhoEmpirico,
  calcularEV,
  calcularLambdas,
  calcularTodosLambdas,
  montarComposicaoLambdas,
  calcularMediasLigaXG,
  calcularMediasTimeXG,
  calcularForcasTimeXG,
  calcularMediasTimeXGComDecay,
  type MediasLigaXG,

} from '@/lib/analytics'

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Autenticação necessária' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const queryResult = previsaoQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'INVALID_QUERY', message: 'Parâmetros inválidos', details: queryResult.error.format() },
        { status: 400 }
      )
    }

    const query = queryResult.data
    const { slug } = params

    const competition = await prisma.competition.findUnique({
      where: { slug },
      include: {
        seasons: {
          where: { isCurrent: true },
        },
      },
    })

    if (!competition) {
      return NextResponse.json({ error: 'LEAGUE_NOT_FOUND', message: 'Liga não encontrada' }, { status: 404 })
    }

    const activeSeason = competition.seasons[0]
    if (!activeSeason) {
      return NextResponse.json({ error: 'NO_ACTIVE_SEASON', message: 'Nenhuma temporada ativa encontrada' }, { status: 404 })
    }

    // Buscar odds para o PRÓXIMO confronto agendado para ter a data de referência
    const confronto = await prisma.match.findFirst({
      where: {
        homeTeamId: query.homeTeamId,
        awayTeamId: query.awayTeamId,
        status: { in: ['SCHEDULED', 'LIVE', 'POSTPONED'] }
      },
      include: {
        odds: {
          where: {
            bookmaker: { name: 'Pinnacle' },
            market: { key: 'match_odds' },
          },
        },
      },
      orderBy: {
        utcDate: 'asc',
      },
    })
    const dataReferencia = confronto ? confronto.utcDate : new Date()

    // Buscar APENAS jogos finalizados da temporada atual
    const todosOsJogos = await prisma.match.findMany({
      where: {
        seasonId: activeSeason.id,
        status: 'FINISHED',
        fthg: { not: null },
        ftag: { not: null },
        utcDate: getSeasonDateFilter(activeSeason.year),
      },
      include: {
        odds: {
          where: {
            bookmaker: { name: 'Pinnacle' },
            market: { key: 'match_odds' },
          },
        },
        stats: {
          select: {
            homeXg: true,
            awayXg: true,
          },
        },
      },
      orderBy: { utcDate: 'asc' },
    })

    if (todosOsJogos.length < 20) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_LEAGUE_DATA', message: 'Dados insuficientes da liga' },
        { status: 400 }
      )
    }

    const jogosTypeSafe = todosOsJogos.map((m) => ({ ...m, fthg: m.fthg!, ftag: m.ftag! }))

    // Calcular estatísticas globais da liga (NUNCA USAM DECAY)
    const mediasLiga = calcularMediasLiga(jogosTypeSafe as any)
    const piLiga = estimarPiLiga(jogosTypeSafe as any, mediasLiga)
    const varianciaLiga = calcularVarianciaGols(jogosTypeSafe as any, mediasLiga)
    const rhoLiga = estimarRhoEmpirico(jogosTypeSafe as any, mediasLiga)

    // Filtrar jogos
    let jogosFiltrados = [...jogosTypeSafe]

    if (query.roundFrom || query.roundTo) {
      jogosFiltrados = jogosFiltrados.filter(j => {
        if (query.roundFrom && j.round != null && j.round < query.roundFrom) return false
        if (query.roundTo && j.round != null && j.round > query.roundTo) return false
        return true
      })
    }

    if (query.months) {
      const allowedMonths = query.months.split(',').map(Number)
      jogosFiltrados = jogosFiltrados.filter(j => {
        const month = new Date(j.utcDate).getMonth() + 1
        return allowedMonths.includes(month)
      })
    }

    if (query.oddsCasaMin || query.oddsCasaMax || query.oddsVisMin || query.oddsVisMax) {
      jogosFiltrados = jogosFiltrados.filter(j => {
        const oddCasa = j.odds.find((o: any) => o.selection === 'home')?.odds
        const oddVis = j.odds.find((o: any) => o.selection === 'away')?.odds
        if (!oddCasa || !oddVis) return false
        if (query.oddsCasaMin && oddCasa < query.oddsCasaMin) return false
        if (query.oddsCasaMax && oddCasa > query.oddsCasaMax) return false
        if (query.oddsVisMin && oddVis < query.oddsVisMin) return false
        if (query.oddsVisMax && oddVis > query.oddsVisMax) return false
        return true
      })
    }

    let mediasHome, mediasAway, forcasHome, forcasAway, lambdaH, lambdaA
    let mediasHomePoisson, mediasAwayPoisson, forcasHomePoisson, forcasAwayPoisson, lambdaHPoisson, lambdaAPoisson
    let mediasHomeXG, mediasAwayXG, forcasHomeXG, forcasAwayXG
    let mediasHomeXGPoisson, mediasAwayXGPoisson, forcasHomeXGPoisson, forcasAwayXGPoisson

    let ligaMediasXG: MediasLigaXG | undefined
    let xgDisponivel = false
    let xgJogosDisponiveis = 0

    let todosLambdas: any
    let composicao: any
    let lambdaFallback = false

    let todosLambdasPoisson: any
    let composicaoPoisson: any
    let lambdaFallbackPoisson = false

    try {
      // 1. Calcular médias XG da liga
      try {
        ligaMediasXG = calcularMediasLigaXG(jogosTypeSafe as any)
        xgDisponivel = true
        xgJogosDisponiveis = ligaMediasXG.totalJogos
      } catch {
        xgDisponivel = false
      }

      // 2. Poisson Simples nunca usa decay
      mediasHomePoisson = calcularMediasTime(query.homeTeamId, jogosFiltrados as any)
      mediasAwayPoisson = calcularMediasTime(query.awayTeamId, jogosFiltrados as any)
      forcasHomePoisson = calcularForcasTime(mediasHomePoisson, mediasLiga)
      forcasAwayPoisson = calcularForcasTime(mediasAwayPoisson, mediasLiga)

      if (xgDisponivel) {
        mediasHomeXGPoisson = calcularMediasTimeXG(query.homeTeamId, jogosFiltrados as any)
        mediasAwayXGPoisson = calcularMediasTimeXG(query.awayTeamId, jogosFiltrados as any)
        forcasHomeXGPoisson = calcularForcasTimeXG(mediasHomeXGPoisson, ligaMediasXG!)
        forcasAwayXGPoisson = calcularForcasTimeXG(mediasAwayXGPoisson, ligaMediasXG!)
      }

      const paramsPoisson = {
        mediasHome: mediasHomePoisson,
        mediasAway: mediasAwayPoisson,
        forcasHome: forcasHomePoisson,
        forcasAway: forcasAwayPoisson,
        ligaMedias: mediasLiga,
        ...(xgDisponivel ? {
          mediasHomeXG: mediasHomeXGPoisson,
          mediasAwayXG: mediasAwayXGPoisson,
          forcasHomeXG: forcasHomeXGPoisson,
          forcasAwayXG: forcasAwayXGPoisson,
          ligaMediasXG,
        } : {})
      }

      const lp = calcularLambdas(query.lambdaMethod as any, paramsPoisson as any)
      lambdaHPoisson = lp.lambdaH
      lambdaAPoisson = lp.lambdaA
      lambdaFallbackPoisson = lp.fallback
      todosLambdasPoisson = calcularTodosLambdas(paramsPoisson as any)
      composicaoPoisson = montarComposicaoLambdas(paramsPoisson as any)

      if (query.modelo !== 'POISSON') {
        // Modelos avançados usam decay (E NUNCA SOFREM FILTROS MANUAIS DE RODADA/MÊS)
        mediasHome = calcularMediasTimeComDecay(query.homeTeamId, jogosTypeSafe as any, dataReferencia)
        mediasAway = calcularMediasTimeComDecay(query.awayTeamId, jogosTypeSafe as any, dataReferencia)
        forcasHome = calcularForcasTime(mediasHome, mediasLiga)
        forcasAway = calcularForcasTime(mediasAway, mediasLiga)

        if (xgDisponivel) {
          mediasHomeXG = calcularMediasTimeXGComDecay(query.homeTeamId, jogosTypeSafe as any, dataReferencia)
          mediasAwayXG = calcularMediasTimeXGComDecay(query.awayTeamId, jogosTypeSafe as any, dataReferencia)
          forcasHomeXG = calcularForcasTimeXG(mediasHomeXG, ligaMediasXG!)
          forcasAwayXG = calcularForcasTimeXG(mediasAwayXG, ligaMediasXG!)
        }

        const paramsDecay = {
          mediasHome,
          mediasAway,
          forcasHome,
          forcasAway,
          ligaMedias: mediasLiga,
          ...(xgDisponivel ? {
            mediasHomeXG,
            mediasAwayXG,
            forcasHomeXG,
            forcasAwayXG,
            ligaMediasXG,
          } : {})
        }

        const ld = calcularLambdas(query.lambdaMethod as any, paramsDecay as any)
        lambdaH = ld.lambdaH
        lambdaA = ld.lambdaA
        lambdaFallback = ld.fallback
        todosLambdas = calcularTodosLambdas(paramsDecay as any)
        composicao = montarComposicaoLambdas(paramsDecay as any)
      } else {
        mediasHome = mediasHomePoisson; mediasAway = mediasAwayPoisson
        forcasHome = forcasHomePoisson; forcasAway = forcasAwayPoisson
        mediasHomeXG = mediasHomeXGPoisson; mediasAwayXG = mediasAwayXGPoisson
        forcasHomeXG = forcasHomeXGPoisson; forcasAwayXG = forcasAwayXGPoisson
        lambdaH = lambdaHPoisson; lambdaA = lambdaAPoisson
        lambdaFallback = lambdaFallbackPoisson
        todosLambdas = todosLambdasPoisson
        composicao = composicaoPoisson
      }
    } catch (e: any) {
      return NextResponse.json(
        { error: 'INSUFFICIENT_TEAM_DATA', message: e.message || 'Dados insuficientes do time' },
        { status: 400 }
      )
    }

    const warnings: string[] = []
    if (lambdaH > 5.0) warnings.push('Aviso: lambdaH > 5.0')
    if (lambdaA > 5.0) warnings.push('Aviso: lambdaA > 5.0')

    const parametrosExtras = {
      piH: piLiga.piH,
      piA: piLiga.piA,
      varH: varianciaLiga.varCasa,
      varA: varianciaLiga.varFora,
      rho: rhoLiga,
    }
    const modeloSelecionado = query.modelo
    let matriz: number[][] = []
    let rhoClamped = false
    let nbWarning = null

    if (modeloSelecionado === 'POISSON') {
      matriz = matrizPlacaresPoisson(lambdaH!, lambdaA!)
    } else if (modeloSelecionado === 'ZIP') {
      matriz = matrizPlacaresZIP(lambdaH!, lambdaA!, parametrosExtras.piH, parametrosExtras.piA)
    } else if (modeloSelecionado === 'NB') {
      const resNB = matrizPlacaresNB(lambdaH!, lambdaA!, parametrosExtras.varH, parametrosExtras.varA)
      matriz = resNB.matriz
      nbWarning = resNB.warning
      if (nbWarning) warnings.push(`NB Warning: ${nbWarning}`)
    } else if (modeloSelecionado === 'DIXON_COLES') {
      const resDC = matrizPlacaresDixonColes(lambdaH!, lambdaA!, parametrosExtras.rho)
      matriz = resDC.matriz
      rhoClamped = resDC.rhoClamped
    }

    const calc = calcularMercados(matriz)
    const calcOddJusta = (prob: number) => prob > 0 ? 1 / prob : 0

    const mercadosFormatados = {
      casa: { prob: calc.casa, oddJusta: calcOddJusta(calc.casa) },
      empate: { prob: calc.empate, oddJusta: calcOddJusta(calc.empate) },
      visitante: { prob: calc.visit, oddJusta: calcOddJusta(calc.visit) },
      btts: {
        sim: calc.btts,
        nao: calc.bttsNao,
      },
      overUnder: {
        '0.5': { over: calc.over05, under: 1 - calc.over05 },
        '1.5': { over: calc.over15, under: 1 - calc.over15 },
        '2.5': { over: calc.over25, under: 1 - calc.over25 },
        '3.5': { over: calc.over35, under: 1 - calc.over35 },
        '4.5': { over: calc.over45, under: 1 - calc.over45 },
      },
      handicaps: []
    }

    let evPorMercado: Record<string, number> | null = null

    if (confronto && confronto.odds && confronto.odds.length > 0) {
      evPorMercado = {}
      const oddHome = confronto.odds.find((o: any) => o.selection === 'home')?.odds
      const oddDraw = confronto.odds.find((o: any) => o.selection === 'draw')?.odds
      const oddAway = confronto.odds.find((o: any) => o.selection === 'away')?.odds
      if (oddHome) evPorMercado['casa'] = calcularEV(mercadosFormatados.casa.prob, oddHome)
      if (oddDraw) evPorMercado['empate'] = calcularEV(mercadosFormatados.empate.prob, oddDraw)
      if (oddAway) evPorMercado['visitante'] = calcularEV(mercadosFormatados.visitante.prob, oddAway)
    }

    return NextResponse.json({
      data: {
        modelo: modeloSelecionado,
        medias: {
          home: mediasHome,
          away: mediasAway,
          liga: { ...mediasLiga, totalJogos: jogosTypeSafe.length },
        },
        forcas: {
          home: forcasHome,
          away: forcasAway,
        },
        lambdas: { home: lambdaH, away: lambdaA },
        matrizPlacares: matriz,
        mercados: mercadosFormatados,
        evPorMercado,
        nbWarning,
        rhoClamped,
        rhoEstimado: parametrosExtras.rho,
        warnings,
        lambdaMethodAtivo: lambdaFallback ? 'FORCAS_RELATIVAS' : query.lambdaMethod,
        lambdaFallback,
        todosLambdas,
        composicao,
        xgDisponivel,
        xgJogosDisponiveis,
        mediasHomeXG,
        mediasAwayXG,
        forcasHomeXG,
        forcasAwayXG,
        ligaMediasXG,
      },
    })
  } catch (error) {
    console.error('[GET /api/ligas/[slug]/previsao]', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
