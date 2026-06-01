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

type SetorType = 'GOL' | 'DEF' | 'MEI' | 'ATA'

export function TabJogadores({ homeStats, awayStats, coverage }: TabJogadoresProps) {
  const [selectedSetor, setSelectedSetor] = useState<SetorType>('ATA')
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerAggregateStats | null>(null)
  
  // Estados de ordenação
  const [sortField, setSortField] = useState<string>('')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  // Mapeamento de métrica primária padrão para ordenação por setor
  const defaultSortField = useMemo(() => {
    switch (selectedSetor) {
      case 'ATA':
        return 'goalsPer90'
      case 'MEI':
        return 'keyPassesPer90'
      case 'DEF':
        return 'tacklesPer90'
      case 'GOL':
        return 'weightedRating'
      default:
        return 'weightedRating'
    }
  }, [selectedSetor])

  // Colunas a serem exibidas por setor baseadas em cobertura (≥ 70%)
  const columnsBySector = useMemo(() => {
    const isCovered = (key: string) => {
      const rate = coverage[key]
      return rate !== undefined && rate >= 0.7
    }

    const baseCols = [
      { label: 'Rating', field: 'weightedRating', sortKey: 'weightedRating', align: 'right' as const },
      { label: 'J', field: 'matchesPlayed', sortKey: 'matchesPlayed', align: 'right' as const },
      { label: 'Min', field: 'totalMinutes', sortKey: 'totalMinutes', align: 'right' as const },
    ]

    switch (selectedSetor) {
      case 'GOL':
        return [
          ...baseCols,
          ...(isCovered('passesTotal') ? [{ label: 'Passes/90', field: 'passesTotalPer90', sortKey: 'passesTotalPer90', align: 'right' as const }] : []),
        ]
      case 'DEF':
        return [
          ...baseCols,
          ...(isCovered('tackles') ? [{ label: 'Desarmes/90', field: 'tacklesPer90', sortKey: 'tacklesPer90', align: 'right' as const }] : []),
          ...(isCovered('interceptions') ? [{ label: 'Intercept./90', field: 'interceptionsPer90', sortKey: 'interceptionsPer90', align: 'right' as const }] : []),
          ...(isCovered('clearances') ? [{ label: 'Cortes/90', field: 'clearancesPer90', sortKey: 'clearancesPer90', align: 'right' as const }] : []),
          ...(isCovered('foulsCommitted') ? [{ label: 'Faltas Com./90', field: 'foulsCommittedPer90', sortKey: 'foulsCommittedPer90', align: 'right' as const }] : []),
        ]
      case 'MEI':
        return [
          ...baseCols,
          ...(isCovered('passesTotal') ? [{ label: 'Passes/90', field: 'passesTotalPer90', sortKey: 'passesTotalPer90', align: 'right' as const }] : []),
          ...(isCovered('passesAccurate') ? [{ label: 'P. Certos/90', field: 'passesAccuratePer90', sortKey: 'passesAccuratePer90', align: 'right' as const }] : []),
          ...(isCovered('keyPasses') ? [{ label: 'P. Chaves/90', field: 'keyPassesPer90', sortKey: 'keyPassesPer90', align: 'right' as const }] : []),
          ...(isCovered('foulsDrawn') ? [{ label: 'Faltas Sofr./90', field: 'foulsDrawnPer90', sortKey: 'foulsDrawnPer90', align: 'right' as const }] : []),
        ]
      case 'ATA':
      default:
        return [
          ...baseCols,
          ...(isCovered('goals') ? [{ label: 'Gols/90', field: 'goalsPer90', sortKey: 'goalsPer90', align: 'right' as const }] : []),
          ...(isCovered('expectedGoals') ? [{ label: 'xG/90', field: 'expectedGoalsPer90', sortKey: 'expectedGoalsPer90', align: 'right' as const }] : []),
          ...(isCovered('goals') && isCovered('expectedGoals') ? [{ label: 'Overperf.', field: 'overperformancePer90', sortKey: 'overperformancePer90', align: 'right' as const }] : []),
          ...(isCovered('shotsTotal') ? [{ label: 'Fin./90', field: 'shotsTotalPer90', sortKey: 'shotsTotalPer90', align: 'right' as const }] : []),
          ...(isCovered('shotsOnTarget') ? [{ label: 'Fin. Alvo/90', field: 'shotsOnTargetPer90', sortKey: 'shotsOnTargetPer90', align: 'right' as const }] : []),
        ]
    }
  }, [selectedSetor, coverage])

  // Resetar a ordenação ao trocar de setor
  React.useEffect(() => {
    setSortField(defaultSortField)
    setSortAsc(false)
  }, [selectedSetor, defaultSortField])

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
    // Filtrar pelo setor selecionado
    const filtered = teamStats.players.filter(p => p.sector === selectedSetor)
    
    // Aplicar ordenação
    return [...filtered].sort((a, b) => {
      const activeField = sortField || defaultSortField
      const valA = (a as any)[activeField]
      const valB = (b as any)[activeField]

      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1

      if (valA < valB) return sortAsc ? -1 : 1
      if (valA > valB) return sortAsc ? 1 : -1
      return 0
    })
  }

  const orderedHomePlayers = useMemo(() => getOrderedPlayers(homeStats), [homeStats, selectedSetor, sortField, sortAsc, defaultSortField])
  const orderedAwayPlayers = useMemo(() => getOrderedPlayers(awayStats), [awayStats, selectedSetor, sortField, sortAsc, defaultSortField])

  // Formatação de valores para exibição
  const formatValue = (val: number | null, decimalPlaces: number = 2) => {
    if (val === null || val === undefined) return '—'
    return val.toFixed(decimalPlaces)
  }

  // Renderização de uma barra de comparação de rating
  const renderComparisonBar = (label: string, homeVal: number | null, awayVal: number | null) => {
    // Barra neutra (50/50) quando qualquer lado é null,
    // evitando falsa impressão de "vitória 100%".
    const bothPresent = homeVal !== null && awayVal !== null
    const h = homeVal ?? 0
    const a = awayVal ?? 0
    const total = h + a
    const homePercent = bothPresent && total > 0 ? (h / total) * 100 : 50
    const awayPercent = bothPresent && total > 0 ? (a / total) * 100 : 50

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs px-1">
          <span className="font-semibold text-primary">{formatValue(homeVal, 2)}</span>
          <span className="text-muted-foreground uppercase font-bold tracking-wider text-[10px]">{label}</span>
          <span className="font-semibold text-blue-400">{formatValue(awayVal, 2)}</span>
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

  // Define se o jogador é um dos top performers (rating alto e overperformance positiva se atacante)
  const isTopPerformer = (player: PlayerAggregateStats) => {
    const rating = player.weightedRating || 0
    const overperformance = player.overperformancePer90 || 0
    if (selectedSetor === 'ATA') {
      return rating >= 7.0 && overperformance > 0
    }
    return rating >= 7.2
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
              // Verifica se há ao menos um rating de setor válido em qualquer lado
              const temAlgumRating =
                (homeStats?.teamRating ?? null) !== null ||
                (awayStats?.teamRating ?? null) !== null ||
                (['GOL', 'DEF', 'MEI', 'ATA'] as const).some(
                  (s) =>
                    (homeStats?.sectorRatings[s] ?? null) !== null ||
                    (awayStats?.sectorRatings[s] ?? null) !== null
                )

              // Fallback quando nenhum dado atinge o piso na janela
              if (!temAlgumRating) {
                return (
                  <div className="col-span-full text-center text-sm text-muted-foreground bg-muted/20 p-6 rounded border border-dashed border-muted">
                    Dados insuficientes nesta janela para calcular os ratings de grandeza.
                  </div>
                )
              }

              // Renderização normal das barras
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

      {/* SELETOR DE SETOR */}
      <div className="flex justify-center md:justify-start gap-1 p-1 bg-muted/30 rounded-lg max-w-fit border">
        {(['ATA', 'MEI', 'DEF', 'GOL'] as SetorType[]).map(s => (
          <Button
            key={s}
            variant={selectedSetor === s ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedSetor(s)}
            className="text-xs px-4"
          >
            {s === 'GOL' ? 'Goleiros' : s === 'DEF' ? 'Defesa' : s === 'MEI' ? 'Meio-Campo' : 'Ataque'}
          </Button>
        ))}
      </div>

      {/* CAMADA 2: VISÃO POR SETOR (LADO A LADO) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* TIME CASA */}
        <Card className="flex flex-col shadow-none border-l-2 border-l-primary">
          <CardHeader className="bg-muted/10 pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-primary uppercase">
                {homeStats?.teamName || 'MANDANTE'}
              </CardTitle>
              <CardDescription className="text-xs">
                Jogadores elegíveis no setor {selectedSetor}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {orderedHomePlayers.length} jogadores
            </Badge>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            {orderedHomePlayers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum jogador deste setor atinge o piso de 270 minutos.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="text-xs font-semibold pl-4">Jogador</TableHead>
                    {columnsBySector.map(c => (
                      <TableHead 
                        key={c.field} 
                        className={`text-${c.align} text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-muted/20 transition-colors`}
                        onClick={() => handleSort(c.sortKey)}
                      >
                        <span className="flex items-center justify-end gap-1 select-none">
                          {c.label}
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedHomePlayers.map(p => {
                    const isTop = isTopPerformer(p)
                    return (
                      <TableRow 
                        key={p.playerId} 
                        onClick={() => setSelectedPlayer(p)}
                        className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      >
                        <TableCell className="font-medium text-xs pl-4 max-w-[150px] truncate">
                          <span className="flex items-center gap-1.5">
                            {isTop && <Star className="w-3.5 h-3.5 fill-primary text-primary shrink-0" />}
                            <span className="group-hover:text-primary transition-colors">{p.name}</span>
                          </span>
                        </TableCell>
                        {columnsBySector.map(c => {
                          const val = (p as any)[c.field]
                          let rendered: React.ReactNode = formatValue(val)
                          
                          // Destaque para overperformance
                          if (c.field === 'overperformancePer90' && val !== null) {
                            const isPositive = val > 0
                            rendered = (
                              <Badge className={`text-[10px] font-semibold ${isPositive ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/30' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30'}`}>
                                {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                              </Badge>
                            )
                          }

                          return (
                            <TableCell key={c.field} className={`text-right text-xs whitespace-nowrap`}>
                              {rendered}
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
                Jogadores elegíveis no setor {selectedSetor}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {orderedAwayPlayers.length} jogadores
            </Badge>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            {orderedAwayPlayers.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum jogador deste setor atinge o piso de 270 minutos.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/5">
                  <TableRow>
                    <TableHead className="text-xs font-semibold pl-4">Jogador</TableHead>
                    {columnsBySector.map(c => (
                      <TableHead 
                        key={c.field} 
                        className={`text-${c.align} text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-muted/20 transition-colors`}
                        onClick={() => handleSort(c.sortKey)}
                      >
                        <span className="flex items-center justify-end gap-1 select-none">
                          {c.label}
                          <ArrowUpDown className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedAwayPlayers.map(p => {
                    const isTop = isTopPerformer(p)
                    return (
                      <TableRow 
                        key={p.playerId} 
                        onClick={() => setSelectedPlayer(p)}
                        className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      >
                        <TableCell className="font-medium text-xs pl-4 max-w-[150px] truncate">
                          <span className="flex items-center gap-1.5">
                            {isTop && <Star className="w-3.5 h-3.5 fill-primary text-primary shrink-0" />}
                            <span className="group-hover:text-blue-400 transition-colors">{p.name}</span>
                          </span>
                        </TableCell>
                        {columnsBySector.map(c => {
                          const val = (p as any)[c.field]
                          let rendered: React.ReactNode = formatValue(val)
                          
                          // Destaque para overperformance
                          if (c.field === 'overperformancePer90' && val !== null) {
                            const isPositive = val > 0
                            rendered = (
                              <Badge className={`text-[10px] font-semibold ${isPositive ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/30' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/30'}`}>
                                {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                              </Badge>
                            )
                          }

                          return (
                            <TableCell key={c.field} className={`text-right text-xs whitespace-nowrap`}>
                              {rendered}
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

      {/* CAMADA 3: DRILL-DOWN (SIDE PANEL) */}
      <Sheet open={!!selectedPlayer} onOpenChange={(open) => { if (!open) setSelectedPlayer(null) }}>
        {selectedPlayer && (
          <SheetContent className="w-full sm:max-w-2xl bg-background/95 backdrop-blur-md flex flex-col h-full border-l p-6">
            <SheetHeader className="pb-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-display font-bold leading-none">{selectedPlayer.name}</SheetTitle>
                  <SheetDescription className="text-xs mt-1">
                    Histórico detalhado das partidas na janela de análise.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 flex flex-col min-h-0 space-y-6 pt-6">
              {/* Cards de Resumo Rápido */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-3 text-center bg-muted/20">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Média Rating</div>
                  <div className="text-lg font-bold flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    {formatValue(selectedPlayer.weightedRating, 2)}
                  </div>
                </Card>
                <Card className="p-3 text-center bg-muted/20">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Partidas</div>
                  <div className="text-lg font-bold">{selectedPlayer.matchesPlayed}</div>
                </Card>
                <Card className="p-3 text-center bg-muted/20">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Minutos</div>
                  <div className="text-lg font-bold">{selectedPlayer.totalMinutes}</div>
                </Card>
              </div>

              {/* Tabela do Histórico de Partidas */}
              <div className="flex-1 flex flex-col min-h-0">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  Jogos Recentes
                </h4>
                <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-card/45">
                  <div className="flex-1 overflow-y-auto max-h-[400px]">
                    <Table>
                      <TableHeader className="bg-muted/10 sticky top-0 backdrop-blur-md z-10">
                        <TableRow>
                          <TableHead className="text-xs font-semibold text-center w-12 pl-4">Rod.</TableHead>
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
                            <TableHead className="text-xs font-semibold text-right w-18">P. Chaves</TableHead>
                          )}
                          {selectedPlayer.sector === 'DEF' && (
                            <>
                              <TableHead className="text-xs font-semibold text-right w-14">Des.</TableHead>
                              <TableHead className="text-xs font-semibold text-right w-14">Int.</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPlayer.matchHistory.map(h => (
                          <TableRow key={h.matchId} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="text-center text-xs text-muted-foreground pl-4">{h.round || '—'}</TableCell>
                            <TableCell className="font-medium text-xs max-w-[140px] truncate">{h.opponentName}</TableCell>
                            <TableCell className="text-center text-xs">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                {h.isHome ? 'Casa' : 'Fora'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs">{h.minutesPlayed || '—'}</TableCell>
                            <TableCell className="text-right text-xs font-bold text-primary">{formatValue(h.rating, 1)}</TableCell>
                            {selectedPlayer.sector === 'ATA' && (
                              <>
                                <TableCell className="text-right text-xs">{h.goals !== null ? h.goals : '—'}</TableCell>
                                <TableCell className="text-right text-xs text-muted-foreground">{formatValue(h.expectedGoals, 2)}</TableCell>
                              </>
                            )}
                            {selectedPlayer.sector === 'MEI' && (
                              <TableCell className="text-right text-xs">{h.keyPasses !== null ? h.keyPasses : '—'}</TableCell>
                            )}
                            {selectedPlayer.sector === 'DEF' && (
                              <>
                                <TableCell className="text-right text-xs">{h.tackles !== null ? h.tackles : '—'}</TableCell>
                                <TableCell className="text-right text-xs">{h.interceptions !== null ? h.interceptions : '—'}</TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

    </div>
  )
}
