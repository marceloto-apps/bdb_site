'use client'

import { useState, useCallback, useMemo } from 'react'
import { FiltrosLiga, ModoModelo, FAIXAS_ODDS_PADRAO } from '@/types/liga'
import type { LambdaMethod } from '@/lib/analytics/types'

export interface UseLeagueFiltersReturn {
  filtros: FiltrosLiga
  modelo: ModoModelo
  
  setHomeTeamId: (id: string | null) => void
  setAwayTeamId: (id: string | null) => void
  setRoundRange: (from: number | null, to: number | null) => void
  setMonths: (months: number[]) => void
  setOddsCasa: (faixas: typeof FAIXAS_ODDS_PADRAO) => void
  setOddsVisitante: (faixas: typeof FAIXAS_ODDS_PADRAO) => void
  setModelo: (modelo: ModoModelo) => void
  lambdaMethod: LambdaMethod
  setLambdaMethod: (method: LambdaMethod) => void
  
  resetFiltros: () => void
  podeCalcular: boolean
  queryParams: Record<string, string>
}

export function useLeagueFilters(defaultMaxRound: number = 38): UseLeagueFiltersReturn {
  const [filtros, setFiltros] = useState<FiltrosLiga>({
    homeTeamId: null,
    awayTeamId: null,
    roundFrom: null,
    roundTo: null,
    months: [], // Vazio = todos
    oddsCasa: FAIXAS_ODDS_PADRAO.map(f => ({ ...f, selected: true })),
    oddsVisitante: FAIXAS_ODDS_PADRAO.map(f => ({ ...f, selected: true })),
  })

  const [modelo, setModelo] = useState<ModoModelo>('POISSON')
  const [lambdaMethod, setLambdaMethod] = useState<LambdaMethod>('MEDIA_SIMPLES')

  const setHomeTeamId = useCallback((id: string | null) => {
    setFiltros(prev => ({ ...prev, homeTeamId: id }))
  }, [])

  const setAwayTeamId = useCallback((id: string | null) => {
    setFiltros(prev => ({ ...prev, awayTeamId: id }))
  }, [])

  const setRoundRange = useCallback((from: number | null, to: number | null) => {
    setFiltros(prev => ({ ...prev, roundFrom: from, roundTo: to }))
  }, [])

  const setMonths = useCallback((months: number[]) => {
    setFiltros(prev => ({ ...prev, months }))
  }, [])

  const setOddsCasa = useCallback((faixas: typeof FAIXAS_ODDS_PADRAO) => {
    setFiltros(prev => ({ ...prev, oddsCasa: faixas }))
  }, [])

  const setOddsVisitante = useCallback((faixas: typeof FAIXAS_ODDS_PADRAO) => {
    setFiltros(prev => ({ ...prev, oddsVisitante: faixas }))
  }, [])

  const resetFiltros = useCallback(() => {
    setFiltros(prev => ({
      ...prev,
      roundFrom: null,
      roundTo: null,
      months: [],
      oddsCasa: FAIXAS_ODDS_PADRAO.map(f => ({ ...f, selected: true })),
      oddsVisitante: FAIXAS_ODDS_PADRAO.map(f => ({ ...f, selected: true })),
    }))
    setModelo('POISSON')
    setLambdaMethod('MEDIA_SIMPLES')
  }, [])

  const podeCalcular = useMemo(() => {
    return filtros.homeTeamId !== null && filtros.awayTeamId !== null
  }, [filtros.homeTeamId, filtros.awayTeamId])

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {}

    if (filtros.homeTeamId) params.homeTeamId = filtros.homeTeamId
    if (filtros.awayTeamId) params.awayTeamId = filtros.awayTeamId
    
    // Filtro de rodadas: apenas se diferente de [null, null] ou [1, maxRound]
    if (filtros.roundFrom && filtros.roundFrom > 1) {
      params.roundFrom = filtros.roundFrom.toString()
    }
    if (filtros.roundTo && filtros.roundTo < defaultMaxRound) {
      params.roundTo = filtros.roundTo.toString()
    }

    // Filtro de meses
    if (filtros.months.length > 0 && filtros.months.length < 12) {
      params.months = filtros.months.join(',')
    }

    // Filtro de odds Casa
    const selecionadosCasa = filtros.oddsCasa.filter(f => f.selected)
    if (selecionadosCasa.length > 0 && selecionadosCasa.length < FAIXAS_ODDS_PADRAO.length) {
      params.oddsCasaMin = Math.min(...selecionadosCasa.map(f => f.min)).toString()
      params.oddsCasaMax = Math.max(...selecionadosCasa.map(f => f.max)).toString()
    }

    // Filtro de odds Visitante
    const selecionadosVis = filtros.oddsVisitante.filter(f => f.selected)
    if (selecionadosVis.length > 0 && selecionadosVis.length < FAIXAS_ODDS_PADRAO.length) {
      params.oddsVisMin = Math.min(...selecionadosVis.map(f => f.min)).toString()
      params.oddsVisMax = Math.max(...selecionadosVis.map(f => f.max)).toString()
    }

    params.modelo = modelo
    params.lambdaMethod = lambdaMethod

    return params
  }, [filtros, modelo, lambdaMethod, defaultMaxRound])

  return {
    filtros,
    modelo,
    setHomeTeamId,
    setAwayTeamId,
    setRoundRange,
    setMonths,
    setOddsCasa,
    setOddsVisitante,
    setModelo,
    lambdaMethod,
    setLambdaMethod,
    resetFiltros,
    podeCalcular,
    queryParams,
  }
}
