// lib/analytics/dispersao-builder.ts

import { Match } from '@prisma/client'
import { calcularMediasLiga } from './medias'
import { calcularMediasTime, calcularForcasTime } from './forca-time'
import { calcularLambdasForcas } from './lambda-calculators'
import {
  calcularDispersaoMetrica,
  consolidarDispersaoLiga,
  type ResultadoDispersaoLiga,
} from './dispersao-condicional'

/**
 * Estrutura mínima de jogo necessária para o diagnóstico.
 * Contém propriedades do Match e dos Stats do xG.
 */
export interface JogoDispersao {
  homeTeamId: string
  awayTeamId: string
  fthg: number
  ftag: number
  utcDate: Date | string
  homeXg: number | null
  awayXg: number | null
}

/**
 * Constrói, para cada jogo da liga, o λ esperado (mandante e visitante)
 * via forças relativas (mesmo método do motor) e empilha observados × esperados.
 *
 * Cada jogo gera 2 observações: lado mandante e lado visitante.
 */
export function construirDiagnosticoDispersao(
  jogos: JogoDispersao[],
): ResultadoDispersaoLiga {
  if (jogos.length < 10) {
    throw new Error('INSUFFICIENT_LEAGUE_DATA: mínimo de 10 jogos para diagnóstico')
  }

  // Reaproveita calcularMediasLiga do motor de forças.
  const mediasLiga = calcularMediasLiga(jogos as any)

  const times = Array.from(
    new Set(jogos.flatMap((j) => [j.homeTeamId, j.awayTeamId])),
  )
  const nParametros = 2 * times.length // ataque + defesa por time

  // Cache de forças por time (sem decay — nível liga, baseline).
  const forcasCache = new Map<string, ReturnType<typeof calcularForcasTime>>()
  for (const t of times) {
    try {
      const medias = calcularMediasTime(t, jogos as any)
      forcasCache.set(t, calcularForcasTime(medias, mediasLiga))
    } catch {
      // Time com poucos jogos — ignorado no diagnóstico (não bloqueia liga).
    }
  }

  const obsGols: number[] = []
  const lamGols: number[] = []
  const obsXg: number[] = []
  const lamXg: number[] = []

  for (const j of jogos) {
    const fH = forcasCache.get(j.homeTeamId)
    const fA = forcasCache.get(j.awayTeamId)
    if (!fH || !fA) continue

    const { lambdaH, lambdaA } = calcularLambdasForcas(fH, fA, mediasLiga)

    // Gols — sempre disponível
    obsGols.push(j.fthg, j.ftag)
    lamGols.push(lambdaH, lambdaA)

    // xG — só quando ambos lados têm valor
    if (j.homeXg != null && j.awayXg != null) {
      obsXg.push(j.homeXg, j.awayXg)
      // LIMITAÇÃO E PROXY:
      // Para o xG, usamos os mesmos λ de gols como proxy esperado.
      // Observação: o xG é uma variável contínua e, estritamente falando,
      // resíduos baseados em Poisson/qui-quadrado não se aplicam de forma ideal.
      // O índice condicional do xG calculado aqui é puramente INDICATIVO de suporte
      // e não deve ser usado para decidir ou sugerir a distribuição final.
      lamXg.push(lambdaH, lambdaA)
    }
  }

  const gols = calcularDispersaoMetrica(obsGols, lamGols, nParametros, 'GOLS')

  // xG só entra se houver cobertura mínima (20 obs ≈ 10 jogos completos).
  const xg =
    obsXg.length >= 20
      ? calcularDispersaoMetrica(obsXg, lamXg, nParametros, 'XG')
      : null

  return consolidarDispersaoLiga(gols, xg)
}
