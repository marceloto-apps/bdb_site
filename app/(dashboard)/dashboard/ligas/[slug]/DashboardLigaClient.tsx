'use client'

import React, { useState, useMemo } from 'react'
import { useLeagueFilters } from '@/lib/hooks/useLeagueFilters'
import { SeletorConfronto } from '@/components/ligas/SeletorConfronto'
import Image from 'next/image'
import { SeletorModelo } from '@/components/ligas/SeletorModelo'
import { SeletorLambda } from '@/components/ligas/SeletorLambda'
import { PainelMedias } from '@/components/ligas/PainelMedias'
import { PainelMatrizPlacares } from '@/components/ligas/PainelMatrizPlacares'
import { PainelProjecaoHandicaps } from '@/components/ligas/PainelProjecaoHandicaps'
import { PainelMercados } from '@/components/ligas/PainelMercados'
import { PainelOddsMercado } from '@/components/ligas/PainelOddsMercado'
import { PainelEvolucao } from '@/components/ligas/PainelEvolucao'
import { PainelMapaValor } from '@/components/ligas/PainelMapaValor'
import { BannerModeloWarning } from '@/components/ligas/BannerModeloWarning'
import { FiltrosAvancados } from '@/components/ligas/FiltrosAvancados'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { TimeOption, ModoModelo, PrevisaoState, MapaValorResponse } from '@/types/liga'
import { TabOddsProfit } from '@/components/ligas/partida/TabOddsProfit'
import { TabGolsXg } from '@/components/ligas/partida/TabGolsXg'
import { TabEscanteiosCartoes } from '@/components/ligas/partida/TabEscanteiosCartoes'
import { TabOverUnder } from '@/components/ligas/partida/TabOverUnder'
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
  mediasLiga: { muH: number; muA: number; varH: number; varA: number; totalJogos: number } | null
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
  const { filtros, modelo, setModelo, setLambdaMethod, queryParams, resetFiltros, ...setters } = filters

  const [previsao, setPrevisao] = useState<PrevisaoState | null>(null)
  const [mapaValor, setMapaValor] = useState<MapaValorResponse | null>(null)
  const [oddsMercado, setOddsMercado] = useState<OddsMercado | null>(null)
  const [estatisticas, setEstatisticas] = useState<{ homeStats: any, awayStats: any } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [activeTab, setActiveTab] = useState('resumo')
  const [mandoContext, setMandoContext] = useState<'CASA_VISITANTE' | 'GERAL'>('CASA_VISITANTE')

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
    } catch {
      setError('Erro de conexão ao calcular previsão')
    } finally {
      setIsCalculating(false)
    }
  }

  const fetchEstatisticas = async (paramsObj: Record<string, string>, contextStr: 'CASA_VISITANTE' | 'GERAL') => {
    try {
      const params = new URLSearchParams(paramsObj)
      params.set('mandoContext', contextStr)
      const resEst = await fetch(`/api/ligas/${liga.slug}/estatisticas?${params}`)
      if (resEst.ok) {
        const jsonEst = await resEst.json()
        setEstatisticas(jsonEst.data)
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas', err)
    }
  }

  const handleCalcularComFiltros = () => {
    setFiltrosAbertos(false)
    fetchPrevisao(queryParams)
    fetchEstatisticas(queryParams, mandoContext)
  }

  const handleCalcularInicial = () => {
    resetFiltros()
    setFiltrosAbertos(false)
    // Recalcular ignorando filtros avançados
    const cleanParams: Record<string, string> = {}
    if (filtros.homeTeamId) cleanParams.homeTeamId = filtros.homeTeamId
    if (filtros.awayTeamId) cleanParams.awayTeamId = filtros.awayTeamId
    cleanParams.modelo = 'POISSON'
    cleanParams.lambdaMethod = 'MEDIA_SIMPLES'
    fetchPrevisao(cleanParams)
    fetchEstatisticas(cleanParams, mandoContext)
  }

  const handleLimparFiltros = () => {
    resetFiltros()
    setError(null)
    // Recalcular com filtros limpos (apenas times + modelo + lambda)
    const cleanParams: Record<string, string> = {}
    if (filtros.homeTeamId) cleanParams.homeTeamId = filtros.homeTeamId
    if (filtros.awayTeamId) cleanParams.awayTeamId = filtros.awayTeamId
    cleanParams.modelo = modelo
    cleanParams.lambdaMethod = filters.lambdaMethod
    fetchPrevisao(cleanParams)
    fetchEstatisticas(cleanParams, mandoContext)
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
        <Button variant="outline" size="icon" asChild className="shrink-0 rounded-full w-10 h-10">
          <Link href="/dashboard/ligas" aria-label="Voltar para Ligas">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
        </Button>

        {liga.logoUrl && (
          <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center overflow-hidden border relative">
            <Image src={liga.logoUrl} alt={liga.name} fill className="object-cover" />
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
        slug={liga.slug}
        times={times}
        onConfrontoDefinido={(mandanteId, visitanteId) => {
          handleFiltrosChange({ homeTeamId: mandanteId, awayTeamId: visitanteId })
          resetFiltros()
          setFiltrosAbertos(false)
        }}
        onCalcular={handleCalcularInicial}
        isCalculando={isCalculating}
      />


      {/* Mensagem de erro global */}
      {error && (
        <Alert variant="destructive" className="animate-in fade-in duration-300">
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
            modeloSelecionado={previsao.modelo}
          />

          <FiltrosAvancados
            filtros={filtros}
            maxRodada={maxRodada}
            onFiltrosChange={handleFiltrosChange}
            onAplicar={handleCalcularComFiltros}
            onLimpar={handleLimparFiltros}
            isCalculando={isCalculating}
            isOpen={filtrosAbertos}
            onOpenChange={setFiltrosAbertos}
            availableOddsCasa={previsao.oddsFaixasDisponiveisCasa}
            availableOddsVisitante={previsao.oddsFaixasDisponiveisVisitante}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full sm:w-auto grid grid-cols-2 md:grid-cols-5 mb-4 h-auto">
              <TabsTrigger value="resumo" className="py-2 whitespace-normal h-full">Principal / Projeção</TabsTrigger>
              <TabsTrigger value="odds" className="py-2 whitespace-normal h-full">Odds / Profit</TabsTrigger>
              <TabsTrigger value="gols" className="py-2 whitespace-normal h-full">Gols / xG / Fin.</TabsTrigger>
              <TabsTrigger value="escanteios" className="py-2 whitespace-normal h-full">Escant. / Cartões / Faltas</TabsTrigger>
              <TabsTrigger value="overunder" className="py-2 whitespace-normal h-full">Over / Under</TabsTrigger>
            </TabsList>

            {activeTab !== 'resumo' && (
              <div className="flex justify-end mb-4 gap-2 animate-in fade-in">
                <Button 
                  variant={mandoContext === 'CASA_VISITANTE' ? 'default' : 'outline'} 
                  size="sm" 
                  onClick={() => {
                    setMandoContext('CASA_VISITANTE')
                    fetchEstatisticas(queryParams, 'CASA_VISITANTE')
                  }}
                  className="text-xs"
                >
                  Contexto: Casa / Visitante
                </Button>
                <Button 
                  variant={mandoContext === 'GERAL' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => {
                    setMandoContext('GERAL')
                    fetchEstatisticas(queryParams, 'GERAL')
                  }}
                  className="text-xs"
                >
                  Contexto: Geral
                </Button>
              </div>
            )}

            <TabsContent value="resumo" className="outline-none space-y-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-stretch">
            {/* Modelos — 4 de 7 colunas = ~57% — ESQUERDA */}
            <div className="lg:col-span-4">
              <SeletorModelo
                modo={modelo}
                onChange={handleModeloChange}
                warnings={previsao.warnings}
              />
            </div>

            {/* Lambdas — 3 de 7 colunas = ~43% — DIREITA */}
            <div className="lg:col-span-3">
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

          {/* SEÇÃO 4: VISUALIZAÇÕES MATRIZ E HANDICAPS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <PainelMatrizPlacares
                matrizPlacares={previsao.matrizPlacares}
                homeTeamName={nomeTimeCasa}
                awayTeamName={nomeTimeVisitante}
                modelo={previsao.modelo}
              />
            </div>
            <div className="lg:col-span-5">
              <PainelProjecaoHandicaps matrizPlacares={previsao.matrizPlacares} />
            </div>
          </div>

          {/* SEÇÃO 5: EVOLUÇÃO DE GOLS */}
          <div className="w-full">
            <PainelEvolucao
              partidas={partidasParaEvolucao}
              homeTeamId={filtros.homeTeamId!}
              awayTeamId={filtros.awayTeamId!}
              homeTeamName={nomeTimeCasa}
              awayTeamName={nomeTimeVisitante}
            />
          </div>
            </TabsContent>

            <TabsContent value="odds" className="outline-none mt-6">
              {estatisticas ? <TabOddsProfit homeStats={estatisticas.homeStats} awayStats={estatisticas.awayStats} /> : <div className="text-center p-8 text-muted-foreground animate-pulse">Carregando estatísticas...</div>}
            </TabsContent>

            <TabsContent value="gols" className="outline-none mt-6">
              {estatisticas ? <TabGolsXg homeStats={estatisticas.homeStats} awayStats={estatisticas.awayStats} /> : <div className="text-center p-8 text-muted-foreground animate-pulse">Carregando estatísticas...</div>}
            </TabsContent>

            <TabsContent value="escanteios" className="outline-none mt-6">
              {estatisticas ? <TabEscanteiosCartoes homeStats={estatisticas.homeStats} awayStats={estatisticas.awayStats} /> : <div className="text-center p-8 text-muted-foreground animate-pulse">Carregando estatísticas...</div>}
            </TabsContent>

            <TabsContent value="overunder" className="outline-none mt-6">
              {estatisticas ? <TabOverUnder homeStats={estatisticas.homeStats} awayStats={estatisticas.awayStats} /> : <div className="text-center p-8 text-muted-foreground animate-pulse">Carregando estatísticas...</div>}
            </TabsContent>
          </Tabs>
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
