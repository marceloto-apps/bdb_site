'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'

interface PartidaStats {
  homeXg: number | null
  awayXg: number | null
  homeCorners: number | null
  awayCorners: number | null
  homeYellowCards: number | null
  awayYellowCards: number | null
  homeRedCards: number | null
  awayRedCards: number | null
}

interface PartidaSerializada {
  round: number | null
  utcDate: string
  homeTeamId: string
  awayTeamId: string
  fthg: number
  ftag: number
  homeTeamName?: string
  awayTeamName?: string
  stats?: PartidaStats | null
}

interface PainelEvolucaoProps {
  partidas: Array<PartidaSerializada>
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
}

export function PainelEvolucao({ partidas, homeTeamId, awayTeamId, homeTeamName, awayTeamName }: PainelEvolucaoProps) {
  const [visao, setVisao] = useState<'ambos' | 'home' | 'away'>('ambos')
  const [evento, setEvento] = useState<'gols' | 'xg' | 'escanteios' | 'cartoes'>('gols')
  const [metrica, setMetrica] = useState<'todos' | 'favor' | 'contra' | 'total'>('todos')

  const data = useMemo(() => {
    // Pegar todas as rodadas que existem nas partidas
    const roundsSet = new Set<number>()
    partidas.forEach(p => { if (p.round !== null) roundsSet.add(p.round) })
    
    if (roundsSet.size === 0) return []

    const maxRound = Math.max(...Array.from(roundsSet))
    const minRound = Math.min(...Array.from(roundsSet))
    
    const chartData = []

    for (let r = minRound; r <= maxRound; r++) {
      const matchHome = partidas.find(p => p.round === r && (p.homeTeamId === homeTeamId || p.awayTeamId === homeTeamId))
      const matchAway = partidas.find(p => p.round === r && (p.homeTeamId === awayTeamId || p.awayTeamId === awayTeamId))

      const getEventValues = (match: any, isHomeTeam: boolean) => {
        if (!match) return { marcados: null, sofridos: null, adv: '' }
        
        const isHome = match.homeTeamId === (isHomeTeam ? homeTeamId : awayTeamId)
        const adv = isHome ? (match.awayTeamName || 'Adversário') : (match.homeTeamName || 'Adversário')
        
        let marcados = null
        let sofridos = null

        if (evento === 'gols') {
          marcados = isHome ? match.fthg : match.ftag
          sofridos = isHome ? match.ftag : match.fthg
        } else if (evento === 'xg') {
          if (match.stats) {
            marcados = isHome ? match.stats.homeXg : match.stats.awayXg
            sofridos = isHome ? match.stats.awayXg : match.stats.homeXg
          }
        } else if (evento === 'escanteios') {
          if (match.stats) {
            marcados = isHome ? match.stats.homeCorners : match.stats.awayCorners
            sofridos = isHome ? match.stats.awayCorners : match.stats.homeCorners
          }
        } else if (evento === 'cartoes') {
          if (match.stats) {
            const homeCards = (match.stats.homeYellowCards ?? 0) + (match.stats.homeRedCards ?? 0)
            const awayCards = (match.stats.awayYellowCards ?? 0) + (match.stats.awayRedCards ?? 0)
            marcados = isHome ? homeCards : awayCards
            sofridos = isHome ? awayCards : homeCards
          }
        }

        return { marcados, sofridos, adv }
      }

      const valuesHome = getEventValues(matchHome, true)
      const valuesAway = getEventValues(matchAway, false)

      chartData.push({
        rodada: r,
        golsMarcadosHome: valuesHome.marcados,
        golsSofridosHome: valuesHome.sofridos,
        totalHome: (valuesHome.marcados !== null && valuesHome.sofridos !== null) ? valuesHome.marcados + valuesHome.sofridos : null,
        advHome: valuesHome.adv,
        golsMarcadosAway: valuesAway.marcados,
        golsSofridosAway: valuesAway.sofridos,
        totalAway: (valuesAway.marcados !== null && valuesAway.sofridos !== null) ? valuesAway.marcados + valuesAway.sofridos : null,
        advAway: valuesAway.adv
      })
    }

    return chartData
  }, [partidas, homeTeamId, awayTeamId, evento])

  const labelFavorHome = useMemo(() => {
    if (evento === 'gols') return `Gols A Favor (${homeTeamName})`
    if (evento === 'xg') return `xG A Favor (${homeTeamName})`
    if (evento === 'escanteios') return `Escanteios A Favor (${homeTeamName})`
    return `Cartões A Favor (${homeTeamName})`
  }, [evento, homeTeamName])

  const labelContraHome = useMemo(() => {
    if (evento === 'gols') return `Gols Contra (${homeTeamName})`
    if (evento === 'xg') return `xG Contra (${homeTeamName})`
    if (evento === 'escanteios') return `Escanteios Contra (${homeTeamName})`
    return `Cartões Contra (${homeTeamName})`
  }, [evento, homeTeamName])

  const labelTotalHome = useMemo(() => {
    if (evento === 'gols') return `Total Gols (${homeTeamName})`
    if (evento === 'xg') return `Total xG (${homeTeamName})`
    if (evento === 'escanteios') return `Total Escanteios (${homeTeamName})`
    return `Total Cartões (${homeTeamName})`
  }, [evento, homeTeamName])

  const labelFavorAway = useMemo(() => {
    if (evento === 'gols') return `Gols A Favor (${awayTeamName})`
    if (evento === 'xg') return `xG A Favor (${awayTeamName})`
    if (evento === 'escanteios') return `Escanteios A Favor (${awayTeamName})`
    return `Cartões A Favor (${awayTeamName})`
  }, [evento, awayTeamName])

  const labelContraAway = useMemo(() => {
    if (evento === 'gols') return `Gols Contra (${awayTeamName})`
    if (evento === 'xg') return `xG Contra (${awayTeamName})`
    if (evento === 'escanteios') return `Escanteios Contra (${awayTeamName})`
    return `Cartões Contra (${awayTeamName})`
  }, [evento, awayTeamName])

  const labelTotalAway = useMemo(() => {
    if (evento === 'gols') return `Total Gols (${awayTeamName})`
    if (evento === 'xg') return `Total xG (${awayTeamName})`
    if (evento === 'escanteios') return `Total Escanteios (${awayTeamName})`
    return `Total Cartões (${awayTeamName})`
  }, [evento, awayTeamName])

  if (data.length === 0) {
    return (
      <Card className="flex flex-col h-full bg-card shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-primary" />
            Evoluções por Partida
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-6 flex items-center justify-center">
          <p className="text-muted-foreground">Sem dados suficientes para gerar o gráfico.</p>
        </CardContent>
      </Card>
    )
  }

  // Custom Tooltip para dark mode e dados extras
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border p-3.5 rounded-lg shadow-xl text-sm">
          <p className="font-bold border-b border-border pb-1.5 mb-2.5 text-foreground">Rodada {label}</p>
          <div className="flex flex-col gap-3">
            {(visao === 'ambos' || visao === 'home') && (
              <div>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                  {homeTeamName} <span className="text-xs text-muted-foreground font-normal">(Mandante)</span>
                </p>
                <div className="grid grid-cols-2 gap-x-4 text-xs mt-1.5 pl-3.5">
                  {(metrica === 'todos' || metrica === 'favor') && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      A Favor: <strong className="text-[#10b981] font-semibold">{payload.find((p: any) => p.dataKey === 'golsMarcadosHome')?.value != null ? Number(payload.find((p: any) => p.dataKey === 'golsMarcadosHome').value).toFixed(evento === 'xg' ? 2 : 0) : '-'}</strong>
                    </span>
                  )}
                  {(metrica === 'todos' || metrica === 'contra') && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      Contra: <strong className="text-[#ef4444] font-semibold">{payload.find((p: any) => p.dataKey === 'golsSofridosHome')?.value != null ? Number(payload.find((p: any) => p.dataKey === 'golsSofridosHome').value).toFixed(evento === 'xg' ? 2 : 0) : '-'}</strong>
                    </span>
                  )}
                  {(metrica === 'todos' || metrica === 'total') && (
                    <span className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      Total: <strong className="text-[#64748b] font-semibold">{payload.find((p: any) => p.dataKey === 'totalHome')?.value != null ? Number(payload.find((p: any) => p.dataKey === 'totalHome').value).toFixed(evento === 'xg' ? 2 : 0) : '-'}</strong>
                    </span>
                  )}
                  <span className="text-muted-foreground/80 mt-0.5 self-center">vs {payload[0]?.payload.advHome || '-'}</span>
                </div>
              </div>
            )}
            {(visao === 'ambos' || visao === 'away') && (
              <div className={visao === 'ambos' ? "pt-2.5 border-t border-border" : ""}>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  {awayTeamName} <span className="text-xs text-muted-foreground font-normal">(Visitante)</span>
                </p>
                <div className="grid grid-cols-2 gap-x-4 text-xs mt-1.5 pl-3.5">
                  {(metrica === 'todos' || metrica === 'favor') && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      A Favor: <strong className="text-[#3b82f6] font-semibold">{payload.find((p: any) => p.dataKey === 'golsMarcadosAway')?.value != null ? Number(payload.find((p: any) => p.dataKey === 'golsMarcadosAway').value).toFixed(evento === 'xg' ? 2 : 0) : '-'}</strong>
                    </span>
                  )}
                  {(metrica === 'todos' || metrica === 'contra') && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      Contra: <strong className="text-[#f97316] font-semibold">{payload.find((p: any) => p.dataKey === 'golsSofridosAway')?.value != null ? Number(payload.find((p: any) => p.dataKey === 'golsSofridosAway').value).toFixed(evento === 'xg' ? 2 : 0) : '-'}</strong>
                    </span>
                  )}
                  {(metrica === 'todos' || metrica === 'total') && (
                    <span className="flex items-center gap-1 text-muted-foreground mt-0.5">
                      Total: <strong className="text-[#94a3b8] font-semibold">{payload.find((p: any) => p.dataKey === 'totalAway')?.value != null ? Number(payload.find((p: any) => p.dataKey === 'totalAway').value).toFixed(evento === 'xg' ? 2 : 0) : '-'}</strong>
                    </span>
                  )}
                  <span className="text-muted-foreground/80 mt-0.5 self-center">vs {payload[0]?.payload.advAway || '-'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm">
      <CardHeader className="pb-3 border-b flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 whitespace-nowrap">
          <LineChartIcon className="w-5 h-5 text-primary" />
          Evoluções por Partida
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto flex-wrap items-center">
          {/* Seletor de Evento */}
          <Tabs value={evento} onValueChange={(e) => setEvento(e as any)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 h-8 w-full sm:w-[320px]">
              <TabsTrigger value="gols" className="text-xs">Gols</TabsTrigger>
              <TabsTrigger value="xg" className="text-xs">xG</TabsTrigger>
              <TabsTrigger value="escanteios" className="text-xs">Escanteios</TabsTrigger>
              <TabsTrigger value="cartoes" className="text-xs">Cartões</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Seletor de Métrica (Todos/A Favor/Contra/Total) */}
          <Tabs value={metrica} onValueChange={(m) => setMetrica(m as any)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 h-8 w-full sm:w-[280px]">
              <TabsTrigger value="todos" className="text-xs">Todos</TabsTrigger>
              <TabsTrigger value="favor" className="text-xs">A Favor</TabsTrigger>
              <TabsTrigger value="contra" className="text-xs">Contra</TabsTrigger>
              <TabsTrigger value="total" className="text-xs">Total</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Seletor de Visão (Mandante/Visitante/Ambos) */}
          <Tabs value={visao} onValueChange={(v) => setVisao(v as any)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-3 h-8 w-full sm:w-[210px]">
              <TabsTrigger value="ambos" className="text-xs">Ambos</TabsTrigger>
              <TabsTrigger value="home" className="text-xs">Mandante</TabsTrigger>
              <TabsTrigger value="away" className="text-xs">Visitante</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 w-full">
        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="rodada" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                allowDecimals={evento === 'xg'}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              />
              
              {(visao === 'ambos' || visao === 'home') && (
                <>
                  {(metrica === 'todos' || metrica === 'favor') && (
                    <Line 
                      name={labelFavorHome}
                      type="monotone" 
                      dataKey="golsMarcadosHome" 
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', stroke: '#10b981', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                  {(metrica === 'todos' || metrica === 'contra') && (
                    <Line 
                      name={labelContraHome}
                      type="monotone" 
                      dataKey="golsSofridosHome" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: 'hsl(var(--card))', stroke: '#ef4444', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                  {(metrica === 'todos' || metrica === 'total') && (
                    <Line 
                      name={labelTotalHome}
                      type="monotone" 
                      dataKey="totalHome" 
                      stroke="#64748b" 
                      strokeWidth={1.5}
                      dot={{ r: 2.5, fill: '#64748b', stroke: '#64748b', strokeWidth: 0 }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                </>
              )}
              {(visao === 'ambos' || visao === 'away') && (
                <>
                  {(metrica === 'todos' || metrica === 'favor') && (
                    <Line 
                      name={labelFavorAway}
                      type="monotone" 
                      dataKey="golsMarcadosAway" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                  {(metrica === 'todos' || metrica === 'contra') && (
                    <Line 
                      name={labelContraAway}
                      type="monotone" 
                      dataKey="golsSofridosAway" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4, fill: 'hsl(var(--card))', stroke: '#f97316', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                  {(metrica === 'todos' || metrica === 'total') && (
                    <Line 
                      name={labelTotalAway}
                      type="monotone" 
                      dataKey="totalAway" 
                      stroke="#94a3b8" 
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                      dot={{ r: 2.5, fill: 'hsl(var(--card))', stroke: '#94a3b8', strokeWidth: 1.5 }}
                      activeDot={{ r: 4 }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
