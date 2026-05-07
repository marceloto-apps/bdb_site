'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'

interface PainelEvolucaoProps {
  partidas: Array<{
    round: number | null
    utcDate: string
    homeTeamId: string
    awayTeamId: string
    fthg: number
    ftag: number
    homeTeamName?: string
    awayTeamName?: string
  }>
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
}

export function PainelEvolucao({ partidas, homeTeamId, awayTeamId, homeTeamName, awayTeamName }: PainelEvolucaoProps) {
  const [visao, setVisao] = useState<'ambos' | 'home' | 'away'>('ambos')

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

      let gmHome = null, gsHome = null, advHome = ''
      if (matchHome) {
        if (matchHome.homeTeamId === homeTeamId) {
          gmHome = matchHome.fthg
          gsHome = matchHome.ftag
          advHome = matchHome.awayTeamName || 'Adversário'
        } else {
          gmHome = matchHome.ftag
          gsHome = matchHome.fthg
          advHome = matchHome.homeTeamName || 'Adversário'
        }
      }

      let gmAway = null, gsAway = null, advAway = ''
      if (matchAway) {
        if (matchAway.homeTeamId === awayTeamId) {
          gmAway = matchAway.fthg
          gsAway = matchAway.ftag
          advAway = matchAway.awayTeamName || 'Adversário'
        } else {
          gmAway = matchAway.ftag
          gsAway = matchAway.fthg
          advAway = matchAway.homeTeamName || 'Adversário'
        }
      }

      chartData.push({
        rodada: r,
        golsMarcadosHome: gmHome,
        golsSofridosHome: gsHome,
        advHome,
        golsMarcadosAway: gmAway,
        golsSofridosAway: gsAway,
        advAway
      })
    }

    return chartData
  }, [partidas, homeTeamId, awayTeamId])

  if (data.length === 0) {
    return (
      <Card className="flex flex-col h-full bg-card shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-primary" />
            Evolução de Gols por Rodada
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
        <div className="bg-card border border-border p-3 rounded-md shadow-md text-sm">
          <p className="font-bold border-b border-border pb-1 mb-2">Rodada {label}</p>
          <div className="flex flex-col gap-2">
            {(visao === 'ambos' || visao === 'home') && (
              <div>
                <p className="font-semibold text-primary">{homeTeamName}</p>
                <div className="grid grid-cols-2 gap-x-4 text-xs">
                  <span>Marcados: {payload.find((p: any) => p.dataKey === 'golsMarcadosHome')?.value ?? '-'}</span>
                  <span>Sofridos: {payload.find((p: any) => p.dataKey === 'golsSofridosHome')?.value ?? '-'}</span>
                  <span className="col-span-2 text-muted-foreground mt-0.5">vs {payload[0]?.payload.advHome || '-'}</span>
                </div>
              </div>
            )}
            {(visao === 'ambos' || visao === 'away') && (
              <div className={visao === 'ambos' ? "pt-2 border-t border-border" : ""}>
                <p className="font-semibold text-blue-500">{awayTeamName}</p>
                <div className="grid grid-cols-2 gap-x-4 text-xs">
                  <span>Marcados: {payload.find((p: any) => p.dataKey === 'golsMarcadosAway')?.value ?? '-'}</span>
                  <span>Sofridos: {payload.find((p: any) => p.dataKey === 'golsSofridosAway')?.value ?? '-'}</span>
                  <span className="col-span-2 text-muted-foreground mt-0.5">vs {payload[0]?.payload.advAway || '-'}</span>
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
      <CardHeader className="pb-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 whitespace-nowrap">
          <LineChartIcon className="w-5 h-5 text-primary" />
          Evolução de Gols
        </CardTitle>
        <Tabs value={visao} onValueChange={(v) => setVisao(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid w-full sm:w-[280px] grid-cols-3 h-8">
            <TabsTrigger value="ambos" className="text-xs">Ambos</TabsTrigger>
            <TabsTrigger value="home" className="text-xs">Mandante</TabsTrigger>
            <TabsTrigger value="away" className="text-xs">Visitante</TabsTrigger>
          </TabsList>
        </Tabs>
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
                allowDecimals={false}
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
                  <Line 
                    name={`Marcados (${homeTeamName})`}
                    type="monotone" 
                    dataKey="golsMarcadosHome" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                  <Line 
                    name={`Sofridos (${homeTeamName})`}
                    type="monotone" 
                    dataKey="golsSofridosHome" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                </>
              )}
              {(visao === 'ambos' || visao === 'away') && (
                <>
                  <Line 
                    name={`Marcados (${awayTeamName})`}
                    type="monotone" 
                    dataKey="golsMarcadosAway" 
                    stroke="#3b82f6" // blue-500 aproximado para data.blue
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                  <Line 
                    name={`Sofridos (${awayTeamName})`}
                    type="monotone" 
                    dataKey="golsSofridosAway" 
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: 'hsl(var(--background))', stroke: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    connectNulls
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
