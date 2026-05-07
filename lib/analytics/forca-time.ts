import { Match } from '@prisma/client'
import { MediasLigaCalculadas } from './medias'
import { pesoTemporal, XI_DEFAULT } from './decay'

export interface DispersaoTime {
  dp: number
  cv: number
  nivel: 'ALTA' | 'MEDIA' | 'BAIXA'
}

export interface FrequenciasObservadas {
  over05: number
  over15: number
  over25: number
  over35: number
  btts: number
  goleadaCasa: number
  goleadaVisit: number
}

export interface MediasTime {
  mgc: number    // gols marcados como mandante
  mgsc: number   // gols sofridos como mandante
  mgv: number    // gols marcados como visitante
  mgsv: number   // gols sofridos como visitante
  jogosCasa: number
  jogosFora: number
  dispersaoCasa: DispersaoTime
  dispersaoFora: DispersaoTime
  freqCasa: FrequenciasObservadas
  freqFora: FrequenciasObservadas
}

export interface ForcasTime {
  fcAtC: number   // ataque como mandante
  fcDfC: number   // defesa como mandante
  fcAtV: number   // ataque como visitante
  fcDfV: number   // defesa como visitante
}

export function getDispersao(gols: number[]): DispersaoTime {
  const n = gols.length
  if (n === 0) return { dp: 0, cv: 0, nivel: 'BAIXA' }
  
  const media = gols.reduce((a, b) => a + b, 0) / n
  if (n === 1) return { dp: 0, cv: 0, nivel: media > 0 ? 'MEDIA' : 'BAIXA' }

  const variancia = gols.reduce((a, b) => a + Math.pow(b - media, 2), 0) / (n - 1)
  const dp = Math.sqrt(variancia)
  
  const cv = media > 0 ? dp / media : (dp > 0 ? 999 : 0)
  
  let nivel: 'ALTA' | 'MEDIA' | 'BAIXA' = 'BAIXA'
  if (cv < 0.50) nivel = 'ALTA'
  else if (cv <= 1.00) nivel = 'MEDIA'
  
  return { dp, cv, nivel }
}

function getFrequencias(jogos: Match[]): FrequenciasObservadas {
  const n = jogos.length
  if (n === 0) return { over05: 0, over15: 0, over25: 0, over35: 0, btts: 0, goleadaCasa: 0, goleadaVisit: 0 }

  let over05 = 0, over15 = 0, over25 = 0, over35 = 0, btts = 0, goleadaCasa = 0, goleadaVisit = 0

  jogos.forEach(j => {
    const fthg = j.fthg as number
    const ftag = j.ftag as number
    const total = fthg + ftag
    if (total > 0.5) over05++
    if (total > 1.5) over15++
    if (total > 2.5) over25++
    if (total > 3.5) over35++
    if (fthg > 0 && ftag > 0) btts++
    if (fthg >= 3 && fthg - ftag >= 3) goleadaCasa++
    if (ftag >= 3 && ftag - fthg >= 3) goleadaVisit++
  })

  return {
    over05: over05 / n,
    over15: over15 / n,
    over25: over25 / n,
    over35: over35 / n,
    btts: btts / n,
    goleadaCasa: goleadaCasa / n,
    goleadaVisit: goleadaVisit / n,
  }
}

export function calcularMediasTime(teamId: string, jogos: Match[]): MediasTime {
  const jogosConcluidos = jogos.filter((j) => j.fthg !== null && j.ftag !== null)
  
  const jogosCasa = jogosConcluidos.filter(j => j.homeTeamId === teamId)
  const jogosFora = jogosConcluidos.filter(j => j.awayTeamId === teamId)

  if (jogosCasa.length < 5 || jogosFora.length < 5) {
    throw new Error(`INSUFFICIENT_TEAM_DATA: Time ${teamId} requer mínimo 5 jogos casa + 5 fora`)
  }

  return {
    mgc: jogosCasa.reduce((s, j) => s + (j.fthg as number), 0) / jogosCasa.length,
    mgsc: jogosCasa.reduce((s, j) => s + (j.ftag as number), 0) / jogosCasa.length,
    mgv: jogosFora.reduce((s, j) => s + (j.ftag as number), 0) / jogosFora.length,
    mgsv: jogosFora.reduce((s, j) => s + (j.fthg as number), 0) / jogosFora.length,
    jogosCasa: jogosCasa.length,
    jogosFora: jogosFora.length,
    dispersaoCasa: getDispersao(jogosCasa.map(j => j.fthg as number)),
    dispersaoFora: getDispersao(jogosFora.map(j => j.ftag as number)),
    freqCasa: getFrequencias(jogosCasa),
    freqFora: getFrequencias(jogosFora),
  }
}

export function calcularMediasTimeComDecay(
  teamId: string,
  jogos: Match[],
  dataReferencia: Date,
  xi: number = XI_DEFAULT
): MediasTime {
  const jogosConcluidos = jogos.filter((j) => j.fthg !== null && j.ftag !== null)
  
  const jogosCasa = jogosConcluidos.filter(j => j.homeTeamId === teamId)
  const jogosFora = jogosConcluidos.filter(j => j.awayTeamId === teamId)

  if (jogosCasa.length < 5 || jogosFora.length < 5) {
    throw new Error(`INSUFFICIENT_TEAM_DATA: Time ${teamId} requer mínimo 5 jogos casa + 5 fora`)
  }

  let somaPesosCasa = 0
  let golsMarcadosCasa = 0
  let golsSofridosCasa = 0
  
  jogosCasa.forEach(j => {
    const w = pesoTemporal(j.utcDate, dataReferencia, xi)
    somaPesosCasa += w
    golsMarcadosCasa += (j.fthg as number) * w
    golsSofridosCasa += (j.ftag as number) * w
  })

  let somaPesosFora = 0
  let golsMarcadosFora = 0
  let golsSofridosFora = 0

  jogosFora.forEach(j => {
    const w = pesoTemporal(j.utcDate, dataReferencia, xi)
    somaPesosFora += w
    golsMarcadosFora += (j.ftag as number) * w
    golsSofridosFora += (j.fthg as number) * w
  })

  return {
    mgc: golsMarcadosCasa / somaPesosCasa,
    mgsc: golsSofridosCasa / somaPesosCasa,
    mgv: golsMarcadosFora / somaPesosFora,
    mgsv: golsSofridosFora / somaPesosFora,
    jogosCasa: jogosCasa.length,
    jogosFora: jogosFora.length,
    dispersaoCasa: getDispersao(jogosCasa.map(j => j.fthg as number)),
    dispersaoFora: getDispersao(jogosFora.map(j => j.ftag as number)),
    freqCasa: getFrequencias(jogosCasa),
    freqFora: getFrequencias(jogosFora),
  }
}

export function calcularForcasTime(
  medias: MediasTime,
  ligaMedias: MediasLigaCalculadas
): ForcasTime {
  return {
    fcAtC: medias.mgc / ligaMedias.muH,
    fcDfC: medias.mgsc / ligaMedias.muA,
    fcAtV: medias.mgv / ligaMedias.muA,
    fcDfV: medias.mgsv / ligaMedias.muH,
  }
}

