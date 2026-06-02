'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { TeamSectorStats, PlayerAggregateStats } from '@/types/jogadores'
import { ArrowUpDown, Shield, Star, Sparkles, User, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TabJogadoresProps {
  homeStats: TeamSectorStats | null
  awayStats: TeamSectorStats | null
  coverage: Record<string, number>
}

type TabCategory = 'sumario' | 'ofensividade' | 'passes' | 'defesa'
type ScaleOption = 'totais' | 'per90' | 'perjogo'

export function TabJogadores({ homeStats, awayStats, coverage }: TabJogadoresProps) {
  const [activeTabCategory, setActiveTabCategory] = useState<TabCategory>('sumario')
  const [activeScale, setActiveScale] = useState<ScaleOption>('totais')
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerAggregateStats | null>(null)
  
  // Estados de ordenação
  const [sortField, setSortField] = useState<string>('weightedRating')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  // Resetar ordenação padrão ao trocar de sub-aba
  React.useEffect(() => {
    if (activeTabCategory === 'sumario') {
      setSortField('weightedRating')
    } else if (activeTabCategory === 'ofensividade') {
      setSortField('goals')
    } else if (activeTabCategory === 'passes') {
      setSortField('keyPasses')
    } else if (activeTabCategory === 'defesa') {
      setSortField('tackles')
    }
    setSortAsc(false)
  }, [activeTabCategory])

  // Helper para computar e escalar valores dinamicamente no client
  const getScaledValue = (
    player: PlayerAggregateStats,
    field: string,
    scale: ScaleOption
  ): number | null => {
    if (field === 'weightedRating') return player.weightedRating
    if (field === 'matchesPlayed') return player.matchesPlayed
    if (field === 'passesAccuratePct') {
      return (player.passesAccurate !== null && player.passesTotal)
        ? (player.passesAccurate / player.passesTotal) * 100
        : null
    }
    
    

    const rawVal = (player as any)[field]
    if (rawVal === null || rawVal === undefined) return null

    if (scale === 'totais') {
      return rawVal
    } else if (scale === 'per90') {
      return player.totalMinutes > 0 ? (rawVal / player.totalMinutes) * 90 : null
    } else if (scale === 'perjogo') {
      return player.matchesPlayed > 0 ? rawVal / player.matchesPlayed : null
    }
    return null
  }

  // Colunas por sub-aba
  const columns = useMemo(() => {
    const isCovered = (key: string) => {
      const rate = coverage[key]
      return rate !== undefined && rate >= 0.7
    }

    const baseCols = [
      { label: 'Rating', field: 'weightedRating', sortKey: 'weightedRating', align: 'right' as const },
      { label: 'J', field: 'matchesPlayed', sortKey: 'matchesPlayed', align: 'right' as const },
      { label: 'MIN', field: 'totalMinutes', sortKey: 'totalMinutes', align: 'right' as const },
    ]

    switch (activeTabCategory) {
      case 'sumario':
        return [
          ...baseCols,
          { label: 'G', field: 'goals', sortKey: 'goals', align: 'right' as const },
          ...(isCovered('shotsTotal') ? [{ label: 'CHT', field: 'shotsTotal', sortKey: 'shotsTotal', align: 'right' as const }] : []),
          ...(isCovered('shotsOnTarget') ? [{ label: 'CHG', field: 'shotsOnTarget', sortKey: 'shotsOnTarget', align: 'right' as const }] : []),
          ...(isCovered('yellowCards') ? [{ label: 'CA', field: 'yellowCards', sortKey: 'yellowCards', align: 'right' as const }] : []),
          ...(isCovered('redCards') ? [{ label: 'CV', field: 'redCards', sortKey: 'redCards', align: 'right' as const }] : []),
          ...(isCovered('passesTotal') && isCovered('passesAccurate') ? [{ label: 'P%', field: 'passesAccuratePct', sortKey: 'passesAccuratePct', align: 'right' as const }] : []),
        ]

      case 'ofensividade':
        return [
          ...baseCols,
          ...(isCovered('goals') ? [{ label: 'G', field: 'goals', sortKey: 'goals', align: 'right' as const }] : []),
          ...(isCovered('expectedGoals') ? [{ label: 'xG', field: 'expectedGoals', sortKey: 'expectedGoals', align: 'right' as const }] : []),
          ...(isCovered('shotsTotal') ? [{ label: 'CHT', field: 'shotsTotal', sortKey: 'shotsTotal', align: 'right' as const }] : []),
          ...(isCovered('shotsOnTarget') ? [{ label: 'CHG', field: 'shotsOnTarget', sortKey: 'shotsOnTarget', align: 'right' as const }] : []),
          ...(isCovered('shotsBlocked') ? [{ label: 'CHB', field: 'shotsBlocked', sortKey: 'shotsBlocked', align: 'right' as const }] : []),
          ...(isCovered('shotsOffTarget') ? [{ label: 'CHF', field: 'shotsOffTarget', sortKey: 'shotsOffTarget', align: 'right' as const }] : []),
          ...(isCovered('dribblesAttempted') ? [{ label: 'DRT', field: 'dribblesAttempted', sortKey: 'dribblesAttempted', align: 'right' as const }] : []),
          ...(isCovered('dribblesSucceeded') ? [{ label: 'DRC', field: 'dribblesSucceeded', sortKey: 'dribblesSucceeded', align: 'right' as const }] : []),
          ...(isCovered('offsides') ? [{ label: 'IMP', field: 'offsides', sortKey: 'offsides', align: 'right' as const }] : []),
        ]

      case 'passes':
        return [
          ...baseCols,
          ...(isCovered('keyPasses') ? [{ label: 'PCH', field: 'keyPasses', sortKey: 'keyPasses', align: 'right' as const }] : []),
          ...(isCovered('assists') ? [{ label: 'AST', field: 'assists', sortKey: 'assists', align: 'right' as const }] : []),
          ...(isCovered('expectedAssists') ? [{ label: 'xA', field: 'expectedAssists', sortKey: 'expectedAssists', align: 'right' as const }] : []),
          ...(isCovered('passesTotal') ? [{ label: 'PT', field: 'passesTotal', sortKey: 'passesTotal', align: 'right' as const }] : []),
          ...(isCovered('passesAccurate') ? [{ label: 'PC', field: 'passesAccurate', sortKey: 'passesAccurate', align: 'right' as const }] : []),
          ...(isCovered('passesTotal') && isCovered('passesAccurate') ? [{ label: 'P%', field: 'passesAccuratePct', sortKey: 'passesAccuratePct', align: 'right' as const }] : []),
          ...(isCovered('touches') ? [{ label: 'TQ', field: 'touches', sortKey: 'touches', align: 'right' as const }] : []),
          ...(isCovered('foulsDrawn') ? [{ label: 'FS', field: 'foulsDrawn', sortKey: 'foulsDrawn', align: 'right' as const }] : []),
          ...(isCovered('crossesTotal') ? [{ label: 'CRT', field: 'crossesTotal', sortKey: 'crossesTotal', align: 'right' as const }] : []),
          ...(isCovered('crossesAccurate') ? [{ label: 'CRC', field: 'crossesAccurate', sortKey: 'crossesAccurate', align: 'right' as const }] : []),
        ]

      case 'defesa':
        return [
          ...baseCols,
          ...(isCovered('tackles') ? [{ label: 'DES', field: 'tackles', sortKey: 'tackles', align: 'right' as const }] : []),
          ...(isCovered('interceptions') ? [{ label: 'INT', field: 'interceptions', sortKey: 'interceptions', align: 'right' as const }] : []),
          ...(isCovered('clearances') ? [{ label: 'COR', field: 'clearances', sortKey: 'clearances', align: 'right' as const }] : []),
          ...(isCovered('dispossessed') ? [{ label: 'DMD', field: 'dispossessed', sortKey: 'dispossessed', align: 'right' as const }] : []),
          ...(isCovered('saves') ? [{ label: 'DEF', field: 'saves', sortKey: 'saves', align: 'right' as const }] : []),
          ...(isCovered('foulsCommitted') ? [{ label: 'FC', field: 'foulsCommitted', sortKey: 'foulsCommitted', align: 'right' as const }] : []),
          ...(isCovered('yellowCards') ? [{ label: 'CA', field: 'yellowCards', sortKey: 'yellowCards', align: 'right' as const }] : []),
          ...(isCovered('redCards') ? [{ label: 'CV', field: 'redCards', sortKey: 'redCards', align: 'right' as const }] : []),
        ]
    }
  }, [activeTabCategory, coverage])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  // Filtrar e ordenar jogadores de um time
  const getOrderedPlayers = (teamStats: TeamSectorStats | null) => {
    if (!teamStats) return []
    
    // Aplicar ordenação baseada no valor calculado da escala ativa
    return [...teamStats.players].sort((a, b) => {
      const valA = getScaledValue(a, sortField, activeScale)
      const valB = getScaledValue(b, sortField, activeScale)

      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }

  const orderedHomePlayers = useMemo(() => getOrderedPlayers(homeStats), [homeStats, sortField, sortAsc, activeScale])
  const orderedAwayPlayers = useMemo(() => getOrderedPlayers(awayStats), [awayStats, sortField, sortAsc, activeScale])

  // Formatação de valores para exibição
  const formatDisplayValue = (val: number | null, field: string) => {
    if (val === null || val === undefined) return '—'
    
    if (field === 'weightedRating') return val.toFixed(2)
    if (field === 'matchesPlayed') return val.toFixed(0)
    if (field === 'passesAccuratePct') return `${val.toFixed(1)}%`
    
    if (field === 'totalMinutes') {
      return activeScale === 'totais' ? val.toFixed(0) : val.toFixed(1)
    }
    
    // Se for decimal (por exemplo, médias Per 90 ou Por Jogo)
    if (activeScale !== 'totais') {
      return val.toFixed(2)
    }
    return val.toFixed(0)
  }

  // Obter o label canônico
  const getColumnLabelWithScale = (col: typeof columns[number]) => {
    return col.label
  }

  // Legenda dinâmica por sub-aba
  const legendItems = useMemo(() => {
    switch (activeTabCategory) {
      case 'sumario':
        return [
          { abbr: 'Rating', desc: 'Nota média ponderada por minutos' },
          { abbr: 'J', desc: 'Jogos disputados' },
          { abbr: 'MIN', desc: 'Minutos jogados' },
          { abbr: 'G', desc: 'Gols marcados' },
          { abbr: 'CHT', desc: 'Chutes realizados' },
          { abbr: 'CHG', desc: 'Chutes no gol' },
          { abbr: 'CA', desc: 'Cartões amarelos' },
          { abbr: 'CV', desc: 'Cartões vermelhos' },
          { abbr: 'P%', desc: 'Porcentagem de passes certos' },
        ]
      case 'ofensividade':
        return [
          { abbr: 'G', desc: 'Gols marcados' },
          { abbr: 'xG', desc: 'Gols esperados (Expected Goals)' },
          { abbr: 'CHT', desc: 'Chutes realizados' },
          { abbr: 'CHG', desc: 'Chutes no gol' },
          { abbr: 'CHB', desc: 'Chutes bloqueados' },
          { abbr: 'CHF', desc: 'Chutes para fora' },
          { abbr: 'DRT', desc: 'Dribles tentados' },
          { abbr: 'DRC', desc: 'Dribles com sucesso' },
          { abbr: 'IMP', desc: 'Impedimentos' },
        ]
      case 'passes':
        return [
          { abbr: 'PCH', desc: 'Passes chave' },
          { abbr: 'AST', desc: 'Assistências para gol' },
          { abbr: 'xA', desc: 'Assistências esperadas (Expected Assists)' },
          { abbr: 'PT', desc: 'Passes totais tentados' },
          { abbr: 'PC', desc: 'Passes certos' },
          { abbr: 'P%', desc: 'Porcentagem de passes certos' },
          { abbr: 'TQ', desc: 'Toques na bola' },
          { abbr: 'FS', desc: 'Faltas sofridas' },
          { abbr: 'CRT', desc: 'Cruzamentos tentados' },
          { abbr: 'CRC', desc: 'Cruzamentos certos' },
        ]
      case 'defesa':
        return [
          { abbr: 'DES', desc: 'Desarmes com sucesso' },
          { abbr: 'INT', desc: 'Interceptações' },
          { abbr: 'COR', desc: 'Cortes (bolas afastadas)' },
          { abbr: 'DMD', desc: 'Vezes desarmado' },
          { abbr: 'DEF', desc: 'Defesas realizadas' },
          { abbr: 'FC', desc: 'Faltas cometidas' },
          { abbr: 'CA', desc: 'Cartões amarelos' },
          { abbr: 'CV', desc: 'Cartões vermelhos' },
        ]
    }
  }, [activeTabCategory])

  const renderComparisonBar = (label: string, homeVal: number | null, awayVal: number | null) => {
    const bothPresent = homeVal !== null && awayVal !== null
    const h = homeVal ?? 0
    const a = awayVal ?? 0
    const total = h + a
    const homePercent = bothPresent && total > 0 ? (h / total) * 100 : 50
    const awayPercent = bothPresent && total > 0 ? (a / total) * 100 : 50

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs px-1">
          <span className="font-semibold text-primary">{formatDisplayValue(homeVal, 'weightedRating')}</span>
          <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">{label}</span>
          <span className="font-semibold text-blue-400">{formatDisplayValue(awayVal, 'weightedRating')}</span>
        </div>
        <div className="h-2.5 w-full bg-muted/40 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500" 
            style={{ width: `${homePercent}%` }}
          />
          <div 
            className="h-full bg-gradient-to-l from-blue-600 to-blue-400 transition-all duration-500" 
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CAMADA 1: SUMÁRIO DE GRANDEZA */}
      <Card className="shadow-sm border-l-4 border-l-primary bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Sumário de Grandeza (Ratings do XI Provável)
          </CardTitle>
          <CardDescription>
            Comparação da força média ponderada dos 11 jogadores com maior minutagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {(() => {
              const temAlgumRating =
                (homeStats?.teamRating ?? null) !== null ||
                (awayStats?.teamRating ?? null) !== null ||
                (['GOL', 'DEF', 'MEI', 'ATA'] as const).some(
                  (s) =>
                    (homeStats?.sectorRatings[s] ?? null) !== null ||
                    (awayStats?.sectorRatings[s] ?? null) !== null
                )

              if (!temAlgumRating) {
                return (
                  <div className="col-span-full text-center text-sm text-muted-foreground bg-muted/20 p-6 rounded border border-dashed border-muted">
                    Dados insuficientes nesta janela para calcular os ratings de grandeza.
                  </div>
                )
              }

              return (
                <>
                  <div className="space-y-4">
                    {renderComparisonBar('XI GERAL', homeStats?.teamRating ?? null, awayStats?.teamRating ?? null)}
                    {renderComparisonBar('GOLEIRO (GOL)', homeStats?.sectorRatings.GOL ?? null, awayStats?.sectorRatings.GOL ?? null)}
                    {renderComparisonBar('DEFESA (DEF)', homeStats?.sectorRatings.DEF ?? null, awayStats?.sectorRatings.DEF ?? null)}
                  </div>
                  <div className="space-y-4">
                    {renderComparisonBar('MEIO-CAMPO (MEI)', homeStats?.sectorRatings.MEI ?? null, awayStats?.sectorRatings.MEI ?? null)}
                    {renderComparisonBar('ATAQUE (ATA)', homeStats?.sectorRatings.ATA ?? null, awayStats?.sectorRatings.ATA ?? null)}
                  </div>
                </>
              )
            })()}
          </div>
        </CardContent>
      </Card>

      {/* SELEÇÃO DE SUB-ABAS E ESCALAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sub-abas de Categorias */}
        <div className="flex flex-wrap gap-1 p-1 bg-muted/30 rounded-lg border max-w-fit">
          <Button
            variant={activeTabCategory === 'sumario' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTabCategory('sumario')}
            className="text-xs px-3 py-1.5 h-auto rounded-md transition-all"
          >
            Sumário
          </Button>
          <Button
            variant={activeTabCategory === 'ofensividade' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTabCategory('ofensividade')}
            className="text-xs px-3 py-1.5 h-auto rounded-md transition-all"
          >
            Ofensividade
          </Button>
          <Button
            variant={activeTabCategory === 'passes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTabCategory('passes')}
            className="text-xs px-3 py-1.5 h-auto rounded-md transition-all"
          >
            Passes
          </Button>
          <Button
            variant={activeTabCategory === 'defesa' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTabCategory('defesa')}
            className="text-xs px-3 py-1.5 h-auto rounded-md transition-all"
          >
            Defesa
          </Button>
        </div>

        {/* Subtítulo Centralizado Dinâmico */}
        <div className="text-center font-semibold text-xs text-muted-foreground uppercase tracking-widest py-1 px-3 bg-muted/10 rounded border border-dashed border-muted/30">
          {activeScale === 'totais' && "Estatísticas Totais"}
          {activeScale === 'per90' && "Estatísticas médias por 90 minutos"}
          {activeScale === 'perjogo' && "Estatísticas médias por jogo"}
        </div>

        {/* Toggles de Escala de Métricas */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border max-w-fit">
          <Button
            variant={activeScale === 'totais' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveScale('totais')}
            className="text-[11px] px-2.5 py-1 h-auto rounded-md"
          >
            Valores Totais
          </Button>
          <Button
            variant={activeScale === 'per90' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveScale('per90')}
            className="text-[11px] px-2.5 py-1 h-auto rounded-md"
          >
            Por 90 Minutos
          </Button>
          <Button
            variant={activeScale === 'perjogo' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveScale('perjogo')}
            className="text-[11px] px-2.5 py-1 h-auto rounded-md"
          >
            Por Jogo
          </Button>
        </div>
      </div>

      {/* CAMADA 2: TABELAS LADO A LADO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* TIME CASA */}
        <Card className="flex flex-col shadow-none border-l-2 border-l-primary">
          <CardHeader className="bg-muted/10 pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-primary uppercase">
                {homeStats?.teamName || 'MANDANTE'}
              </CardTitle>
              <CardDescription className="text-xs">
                Estatísticas gerais de todos os jogadores (mínimo 180 min)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {orderedHomePlayers.length} jogadores
            </Badge>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            {orderedHomePlayers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum jogador deste time atinge o piso de 180 minutos.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="text-xs font-semibold pl-4">Jogador</TableHead>
                    {columns.map(c => (
                      <TableHead 
                        key={c.field} 
                        className="text-right text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-muted/20 transition-colors select-none"
                        onClick={() => handleSort(c.sortKey)}
                      >
                        <span className="flex items-center justify-end gap-1">
                          {getColumnLabelWithScale(c)}
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedHomePlayers.map(p => {
                    const isHighRating = (p.weightedRating || 0) >= 7.0
                    return (
                      <TableRow 
                        key={p.playerId} 
                        onClick={() => setSelectedPlayer(p)}
                        className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      >
                        <TableCell className="font-medium text-xs pl-4 max-w-[140px] truncate">
                          <span className="flex items-center gap-1.5">
                            {isHighRating && <Star className="w-3 h-3 fill-primary text-primary shrink-0" />}
                            <span className="group-hover:text-primary transition-colors">{p.name}</span>
                          </span>
                        </TableCell>
                        {columns.map(c => {
                          const val = getScaledValue(p, c.field, activeScale)
                          return (
                            <TableCell key={c.field} className="text-right text-xs whitespace-nowrap">
                              {formatDisplayValue(val, c.field)}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* TIME VISITANTE */}
        <Card className="flex flex-col shadow-none border-l-2 border-l-blue-500">
          <CardHeader className="bg-muted/10 pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-blue-400 uppercase">
                {awayStats?.teamName || 'VISITANTE'}
              </CardTitle>
              <CardDescription className="text-xs">
                Estatísticas gerais de todos os jogadores (mínimo 180 min)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {orderedAwayPlayers.length} jogadores
            </Badge>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            {orderedAwayPlayers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum jogador deste time atinge o piso de 180 minutos.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="text-xs font-semibold pl-4">Jogador</TableHead>
                    {columns.map(c => (
                      <TableHead 
                        key={c.field} 
                        className="text-right text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-muted/20 transition-colors select-none"
                        onClick={() => handleSort(c.sortKey)}
                      >
                        <span className="flex items-center justify-end gap-1">
                          {getColumnLabelWithScale(c)}
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedAwayPlayers.map(p => {
                    const isHighRating = (p.weightedRating || 0) >= 7.0
                    return (
                      <TableRow 
                        key={p.playerId} 
                        onClick={() => setSelectedPlayer(p)}
                        className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      >
                        <TableCell className="font-medium text-xs pl-4 max-w-[140px] truncate">
                          <span className="flex items-center gap-1.5">
                            {isHighRating && <Star className="w-3 h-3 fill-primary text-primary shrink-0" />}
                            <span className="group-hover:text-blue-400 transition-colors">{p.name}</span>
                          </span>
                        </TableCell>
                        {columns.map(c => {
                          const val = getScaledValue(p, c.field, activeScale)
                          return (
                            <TableCell key={c.field} className="text-right text-xs whitespace-nowrap">
                              {formatDisplayValue(val, c.field)}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>

      {/* CAMADA 2.5: LEGENDA DINÂMICA */}
      <Card className="bg-muted/10 border border-muted/30 p-4 shadow-none">
        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Abreviações das Colunas:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-1.5">
          {legendItems.map((item) => (
            <div key={item.abbr} className="text-xs flex items-baseline gap-1.5">
              <span className="font-bold text-primary shrink-0 min-w-[32px]">{item.abbr}</span>
              <span className="text-muted-foreground text-[11px] truncate" title={item.desc}>{item.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* CAMADA 3: DRILL-DOWN (SIDE PANEL DE HISTÓRICO DE JOGOS) */}
      <Sheet open={!!selectedPlayer} onOpenChange={(open) => { if (!open) setSelectedPlayer(null) }}>
        {selectedPlayer && (
          <SheetContent className="w-full sm:max-w-2xl bg-background/95 backdrop-blur-md flex flex-col h-full border-l p-6 overflow-hidden">
            <SheetHeader className="pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-display font-bold leading-none">{selectedPlayer.name}</SheetTitle>
                  <SheetDescription className="text-xs mt-1">
                    Histórico detalhado por partida na temporada atual.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 flex flex-col min-h-0 space-y-6 pt-6 overflow-y-auto pr-1">
              {/* Cards de Resumo Rápido */}
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-2.5 text-center bg-muted/20">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Média Rating</div>
                  <div className="text-base font-bold flex items-center justify-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                    {formatDisplayValue(selectedPlayer.weightedRating, 'weightedRating')}
                  </div>
                </Card>
                <Card className="p-2.5 text-center bg-muted/20">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Partidas</div>
                  <div className="text-base font-bold">{selectedPlayer.matchesPlayed}</div>
                </Card>
                <Card className="p-2.5 text-center bg-muted/20">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Minutos Totais</div>
                  <div className="text-base font-bold">{selectedPlayer.totalMinutes}</div>
                </Card>
                <Card className="p-2.5 text-center bg-muted/20">
                  <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Minutos/Jogo</div>
                  <div className="text-base font-bold">
                    {formatDisplayValue(selectedPlayer.totalMinutes / selectedPlayer.matchesPlayed, 'minutosPorPartida')}
                  </div>
                </Card>
              </div>

              {/* Tabela do Histórico de Partidas */}
              <div className="flex flex-col min-h-0">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  Jogos no Campeonato
                </h4>
                <div className="border rounded-lg overflow-x-auto bg-card/45">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-center w-12 pl-4">Rodada</TableHead>
                        <TableHead className="text-xs font-semibold">Adversário</TableHead>
                        <TableHead className="text-xs font-semibold text-center w-12">Mando</TableHead>
                        <TableHead className="text-xs font-semibold text-right w-16">Minutos</TableHead>
                        <TableHead className="text-xs font-semibold text-right w-16">Rating</TableHead>
                        {selectedPlayer.sector === 'ATA' && (
                          <>
                            <TableHead className="text-xs font-semibold text-right w-14">Gols</TableHead>
                            <TableHead className="text-xs font-semibold text-right w-14">xG</TableHead>
                          </>
                        )}
                        {selectedPlayer.sector === 'MEI' && (
                          <>
                            <TableHead className="text-xs font-semibold text-right w-14">Assist.</TableHead>
                            <TableHead className="text-xs font-semibold text-right w-14">P. Chaves</TableHead>
                          </>
                        )}
                        {selectedPlayer.sector === 'DEF' && (
                          <>
                            <TableHead className="text-xs font-semibold text-right w-14">Desarm.</TableHead>
                            <TableHead className="text-xs font-semibold text-right w-14">Intercept.</TableHead>
                          </>
                        )}
                        {selectedPlayer.sector === 'GOL' && (
                          <TableHead className="text-xs font-semibold text-right w-14">Defesas</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlayer.matchHistory.map(h => (
                        <TableRow key={h.matchId} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="text-center text-xs text-muted-foreground pl-4">{h.round || '—'}</TableCell>
                          <TableCell className="font-medium text-xs max-w-[120px] truncate">{h.opponentName}</TableCell>
                          <TableCell className="text-center text-xs">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {h.isHome ? 'Casa' : 'Fora'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs">{h.minutesPlayed || '—'}</TableCell>
                          <TableCell className="text-right text-xs font-bold text-primary">{formatDisplayValue(h.rating, 'weightedRating')}</TableCell>
                          {selectedPlayer.sector === 'ATA' && (
                            <>
                              <TableCell className="text-right text-xs">{h.goals !== null ? h.goals : '—'}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">{formatDisplayValue(h.expectedGoals, 'expectedGoals')}</TableCell>
                            </>
                          )}
                          {selectedPlayer.sector === 'MEI' && (
                            <>
                              <TableCell className="text-right text-xs">{h.assists !== null ? h.assists : '—'}</TableCell>
                              <TableCell className="text-right text-xs">{h.keyPasses !== null ? h.keyPasses : '—'}</TableCell>
                            </>
                          )}
                          {selectedPlayer.sector === 'DEF' && (
                            <>
                              <TableCell className="text-right text-xs">{h.tackles !== null ? h.tackles : '—'}</TableCell>
                              <TableCell className="text-right text-xs">{h.interceptions !== null ? h.interceptions : '—'}</TableCell>
                            </>
                          )}
                          {selectedPlayer.sector === 'GOL' && (
                            <TableCell className="text-right text-xs">{h.saves !== null ? h.saves : '—'}</TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

    </div>
  )
}
