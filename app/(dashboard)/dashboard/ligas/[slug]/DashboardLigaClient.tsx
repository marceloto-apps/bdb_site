'use client'

import React, { useState, useMemo } from 'react'
import { useLeagueFilters } from '@/lib/hooks/useLeagueFilters'
import { SeletorConfronto } from '@/components/ligas/SeletorConfronto'
import { SeletorModelo } from '@/components/ligas/SeletorModelo'
import { SeletorLambda } from '@/components/ligas/SeletorLambda'
import { PainelMedias } from '@/components/ligas/PainelMedias'
import { PainelMatrizPlacares } from '@/components/ligas/PainelMatrizPlacares'
import { PainelMercados } from '@/components/ligas/PainelMercados'
import { PainelOddsMercado } from '@/components/ligas/PainelOddsMercado'
import { PainelEvolucao } from '@/components/ligas/PainelEvolucao'
import { PainelMapaValor } from '@/components/ligas/PainelMapaValor'
import { BannerModeloWarning } from '@/components/ligas/BannerModeloWarning'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { TimeOption, ModoModelo, PrevisaoState, MapaValorResponse } from '@/types/liga'
import type { LambdaMethod } from '@/lib/analytics/types'
import { OddsMercado } from '@/lib/validations/odds-mercado'

interface PartidaSerializada {
  round: number | null
  utcDate: string
  homeTeamId: string
  awayTeamId: string
  fthg: number
  ftag: number
  homeTeamName: string
  awayTeamName: string
}

interface DashboardLigaClientProps {
  liga: { id: string; name: string; slug: string; country: string | null; logoUrl: string | null; temporada: string }
  times: TimeOption[]
  mediasLiga: { muH: number; muA: number; totalJogos: number } | null
  maxRodada: number
  totalJogos: number
  partidasIniciais: PartidaSerializada[]
}

export function DashboardLigaClient({
  liga,
  times,
  mediasLiga,
  maxRodada,
  totalJogos,
  partidasIniciais
}: DashboardLigaClientProps) {
  const filters = useLeagueFilters(maxRodada)
  const { filtros, modelo, setModelo, lambdaMethod: _lambdaMethod, setLambdaMethod, podeCalcular: _podeCalcular, queryParams, ...setters } = filters

  const [previsao, setPrevisao] = useState<PrevisaoState | null>(null)
  const [mapaValor, setMapaValor] = useState<MapaValorResponse | null>(null)
  const [oddsMercado, setOddsMercado] = useState<OddsMercado | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nomeTimeCasa = useMemo(() => times.find(t => t.id === filtros.homeTeamId)?.name ?? '', [times, filtros.homeTeamId])
  const nomeTimeVisitante = useMemo(() => times.find(t => t.id === filtros.awayTeamId)?.name ?? '', [times, filtros.awayTeamId])

  const partidasParaEvolucao = useMemo(() => {
    if (!filtros.homeTeamId || !filtros.awayTeamId) return []
    return partidasIniciais.filter(p =>
      p.homeTeamId === filtros.homeTeamId ||
      p.awayTeamId === filtros.homeTeamId ||
      p.homeTeamId === filtros.awayTeamId ||
      p.awayTeamId === filtros.awayTeamId
    )
  }, [partidasIniciais, filtros.homeTeamId, filtros.awayTeamId])

  const handleFiltrosChange = (updates: Partial<typeof filtros>) => {
    if (updates.homeTeamId !== undefined) setters.setHomeTeamId(updates.homeTeamId)
    if (updates.awayTeamId !== undefined) setters.setAwayTeamId(updates.awayTeamId)
    if (updates.roundFrom !== undefined || updates.roundTo !== undefined) {
      setters.setRoundRange(
        updates.roundFrom !== undefined ? updates.roundFrom : filtros.roundFrom,
        updates.roundTo !== undefined ? updates.roundTo : filtros.roundTo
      )
    }
    if (updates.months !== undefined) setters.setMonths(updates.months)
    if (updates.oddsCasa !== undefined) setters.setOddsCasa(updates.oddsCasa)
    if (updates.oddsVisitante !== undefined) setters.setOddsVisitante(updates.oddsVisitante)
  }

  const fetchPrevisao = async (paramsObj: Record<string, string>) => {
    setIsCalculating(true)
    setError(null)
    try {
      const params = new URLSearchParams(paramsObj)
      const res = await fetch(`/api/ligas/${liga.slug}/previsao?${params}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.message || json.error || 'Erro desconhecido')
        setPrevisao(null)
        return
      }
      setPrevisao(json.data)

      if (!mapaValor) {
        const resMapa = await fetch(`/api/ligas/${liga.slug}/mapa-valor`)
        const jsonMapa = await resMapa.json()
        if (resMapa.ok) {
          setMapaValor(jsonMapa.data)
        }
      }
    } catch (_err) {
      setError('Erro de conexão ao calcular previsão')
      setPrevisao(null)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCalcular = () => {
    fetchPrevisao(queryParams)
  }

  const handleModeloChange = (novoModelo: ModoModelo) => {
    setModelo(novoModelo)
    if (previsao) {
      const newParams = { ...queryParams, modelo: novoModelo }
      fetchPrevisao(newParams)
    }
  }

  const handleLambdaChange = (novoLambda: LambdaMethod) => {
    setLambdaMethod(novoLambda)
    if (previsao) {
      const newParams = { ...queryParams, lambdaMethod: novoLambda }
      fetchPrevisao(newParams)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header da liga */}
      <div className="flex items-center gap-4">
        {liga.logoUrl && (
          <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden border">
            <img src={liga.logoUrl} alt={liga.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-display font-bold">{liga.name}</h1>
          <p className="text-muted-foreground text-sm">
            Temporada {liga.temporada} · {totalJogos} jogos
            {mediasLiga && ` · μH = ${mediasLiga.muH.toFixed(2)} · μA = ${mediasLiga.muA.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Seletor de Confronto */}
      <SeletorConfronto
        times={times}
        filtros={filtros}
        maxRodada={maxRodada}
        onFiltrosChange={handleFiltrosChange}
        onCalcular={handleCalcular}
        isCalculating={isCalculating}
      />

      {/* Mensagem de erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conteúdo */}
      {previsao ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <BannerModeloWarning 
            nbWarning={previsao.nbWarning}
            rhoClamped={previsao.rhoClamped}
            modeloAutoConfianca={previsao.modeloAuto?.confianca}
            modeloSelecionado={previsao.modelo}
          />

          <PainelMedias
            medias={previsao.medias}
            forcas={previsao.forcas}
            homeTeamName={nomeTimeCasa}
            awayTeamName={nomeTimeVisitante}
            mediasHomeXG={previsao.mediasHomeXG}
            mediasAwayXG={previsao.mediasAwayXG}
            forcasHomeXG={previsao.forcasHomeXG}
            forcasAwayXG={previsao.forcasAwayXG}
            ligaMediasXG={previsao.ligaMediasXG}
            xgDisponivel={previsao.xgDisponivel}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
            {/* Modelos — 3 de 5 colunas = 60% — ESQUERDA */}
            <div className="lg:col-span-3">
              <SeletorModelo
                modo={modelo}
                modeloAutoResult={previsao.modeloAuto}
                onChange={handleModeloChange}
                warnings={previsao.warnings}
              />
            </div>

            {/* Lambdas — 2 de 5 colunas = 40% — DIREITA */}
            <div className="lg:col-span-2">
              <SeletorLambda
                todosLambdas={previsao.todosLambdas}
                composicao={previsao.composicao}
                lambdaAtivo={previsao.lambdaMethodAtivo}
                xgDisponivel={previsao.xgDisponivel}
                onChange={handleLambdaChange}
              />
            </div>
          </div>

          {/* SEÇÃO 3: MERCADOS E VALOR */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <PainelOddsMercado
                slug={liga.slug}
                homeTeamId={filtros.homeTeamId}
                awayTeamId={filtros.awayTeamId}
                onOddsChange={setOddsMercado}
              />
            </div>
            <div className="lg:col-span-8">
              <PainelMercados
                mercados={previsao.mercados}
                evPorMercado={previsao.evPorMercado}
                homeTeamName={nomeTimeCasa}
                awayTeamName={nomeTimeVisitante}
                oddsMercado={oddsMercado}
              />
            </div>
          </div>

          {mapaValor && (
            <div className="w-full">
              <PainelMapaValor mapaValor={mapaValor as any} />
            </div>
          )}

          {/* SEÇÃO 4: VISUALIZAÇÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6">
              <PainelMatrizPlacares
                matrizPlacares={previsao.matrizPlacares}
                homeTeamName={nomeTimeCasa}
                awayTeamName={nomeTimeVisitante}
                modelo={previsao.modelo}
              />
            </div>
            <div className="lg:col-span-6">
              <PainelEvolucao
                partidas={partidasParaEvolucao}
                homeTeamId={filtros.homeTeamId!}
                awayTeamId={filtros.awayTeamId!}
                homeTeamName={nomeTimeCasa}
                awayTeamName={nomeTimeVisitante}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/20">
          <h3 className="text-lg font-semibold mb-2">Confronto não definido</h3>
          <p className="text-muted-foreground max-w-md">
            Selecione o mandante e o visitante no painel acima e clique em &quot;Calcular Previsão&quot; para visualizar os dados.
          </p>
        </div>
      )}
    </div>
  )
}
