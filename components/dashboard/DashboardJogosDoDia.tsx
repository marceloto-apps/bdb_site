'use client'

import React, { useState, useMemo } from 'react'
import { DashboardMatchCard } from './DashboardMatchCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Search, Filter, RefreshCw, X, Radio } from 'lucide-react'
import type { MatchItem, LeagueFilterOption } from '@/lib/dashboard/jogos-do-dia'

interface DashboardJogosDoDiaProps {
  initialPartidas: MatchItem[]
  ligas: LeagueFilterOption[]
  estatisticas?: {
    total: number
    aoVivo: number
    agendados: number
    finalizados: number
  }
  dataReferencia: {
    dateStr: string
    dataCompleta: string
  }
}

const ITEMS_PER_PAGE = 18

export function DashboardJogosDoDia({
  initialPartidas,
  ligas,
  dataReferencia,
}: DashboardJogosDoDiaProps) {
  const [selectedLeague, setSelectedLeague] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE)

  // As 4 principais ligas do dia para acesso rápido em pílulas
  const topLigasPills = useMemo(() => {
    return ligas.slice(0, 4)
  }, [ligas])

  // Filtragem dinâmica de partidas
  const filteredMatches = useMemo(() => {
    return initialPartidas.filter((match) => {
      // Filtro de liga
      if (selectedLeague !== 'all' && match.competition.slug !== selectedLeague) {
        return false
      }

      // Filtro de status
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'LIVE' && match.status !== 'LIVE') return false
        if (selectedStatus === 'SCHEDULED' && match.status !== 'SCHEDULED') return false
        if (selectedStatus === 'FINISHED' && match.status !== 'FINISHED') return false
      }

      // Filtro de busca textual (times ou liga)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const home = match.homeTeam.displayName.toLowerCase()
        const away = match.awayTeam.displayName.toLowerCase()
        const comp = match.competition.name.toLowerCase()
        if (!home.includes(query) && !away.includes(query) && !comp.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [initialPartidas, selectedLeague, selectedStatus, searchQuery])

  // Estatísticas contextuais da liga selecionada
  const contextualStats = useMemo(() => {
    const list =
      selectedLeague === 'all'
        ? initialPartidas
        : initialPartidas.filter((m) => m.competition.slug === selectedLeague)

    return {
      total: list.length,
      aoVivo: list.filter((m) => m.status === 'LIVE').length,
      agendados: list.filter((m) => m.status === 'SCHEDULED').length,
      finalizados: list.filter((m) => m.status === 'FINISHED').length,
    }
  }, [initialPartidas, selectedLeague])

  const displayedMatches = filteredMatches.slice(0, visibleCount)
  const hasMore = visibleCount < filteredMatches.length

  const handleResetFilters = () => {
    setSelectedLeague('all')
    setSelectedStatus('ALL')
    setSearchQuery('')
    setVisibleCount(ITEMS_PER_PAGE)
  }

  return (
    <section className="space-y-4">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Jogos do Dia
            </h2>
            {contextualStats.aoVivo > 0 && (
              <Badge
                variant="outline"
                className="bg-red-500/10 text-red-400 border-red-500/30 flex items-center gap-1 text-xs py-0.5"
              >
                <Radio className="w-3 h-3 animate-pulse" />
                {contextualStats.aoVivo} ao vivo
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            {dataReferencia.dataCompleta}
          </p>
        </div>

        {/* Dropdown seletor de liga */}
        <div className="w-full sm:w-72">
          <Select
            value={selectedLeague}
            onValueChange={(val) => {
              setSelectedLeague(val)
              setVisibleCount(ITEMS_PER_PAGE)
            }}
          >
            <SelectTrigger className="w-full bg-surface border-border text-sm">
              <SelectValue placeholder="Filtrar por Liga" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">
                Todas as minhas ligas ({initialPartidas.length})
              </SelectItem>
              {ligas.map((liga) => (
                <SelectItem key={liga.slug} value={liga.slug}>
                  {liga.name} ({liga.totalJogos})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Barra de Filtros Rápidos (Pílulas de Ligas + Tabs de Status) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Pílulas de Ligas Top */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => {
              setSelectedLeague('all')
              setVisibleCount(ITEMS_PER_PAGE)
            }}
            className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
              selectedLeague === 'all'
                ? 'bg-primary text-black font-semibold shadow-sm'
                : 'bg-surface hover:bg-muted text-muted-foreground hover:text-white border border-border/80'
            }`}
          >
            Todas ({initialPartidas.length})
          </button>
          {topLigasPills.map((liga) => (
            <button
              key={liga.slug}
              onClick={() => {
                setSelectedLeague(liga.slug)
                setVisibleCount(ITEMS_PER_PAGE)
              }}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 ${
                selectedLeague === 'liga-' + liga.slug || selectedLeague === liga.slug
                  ? 'bg-primary text-black font-semibold shadow-sm'
                  : 'bg-surface hover:bg-muted text-muted-foreground hover:text-white border border-border/80'
              }`}
            >
              {liga.name} ({liga.totalJogos})
            </button>
          ))}
        </div>

        {/* Tabs de Status */}
        <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border/80 text-xs shrink-0 self-start md:self-auto">
          <button
            onClick={() => {
              setSelectedStatus('ALL')
              setVisibleCount(ITEMS_PER_PAGE)
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedStatus === 'ALL'
                ? 'bg-background text-white font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Todos ({contextualStats.total})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('LIVE')
              setVisibleCount(ITEMS_PER_PAGE)
            }}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
              selectedStatus === 'LIVE'
                ? 'bg-red-500/20 text-red-400 font-semibold'
                : contextualStats.aoVivo > 0
                ? 'text-red-400/90 hover:text-red-300'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            {contextualStats.aoVivo > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
            Ao Vivo ({contextualStats.aoVivo})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('SCHEDULED')
              setVisibleCount(ITEMS_PER_PAGE)
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedStatus === 'SCHEDULED'
                ? 'bg-background text-white font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Agendados ({contextualStats.agendados})
          </button>

          <button
            onClick={() => {
              setSelectedStatus('FINISHED')
              setVisibleCount(ITEMS_PER_PAGE)
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              selectedStatus === 'FINISHED'
                ? 'bg-background text-white font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            Finalizados ({contextualStats.finalizados})
          </button>
        </div>
      </div>

      {/* Campo de Busca Rápida */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar time ou liga..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 bg-surface/60 border-border text-xs h-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid de Partidas */}
      {displayedMatches.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {displayedMatches.map((match) => (
              <DashboardMatchCard key={match.id} match={match} />
            ))}
          </div>

          {/* Botão Ver Mais Partidas */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                className="bg-surface border-border text-xs hover:bg-muted text-text-secondary"
              >
                Carregar mais partidas (+{filteredMatches.length - visibleCount} restantes)
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-border rounded-xl bg-surface/30 space-y-3">
          <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary text-base">
              Nenhuma partida encontrada
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Não há partidas de hoje correspondentes aos filtros selecionados. Experimente trocar a liga ou limpar os filtros.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs gap-1.5 mt-2"
          >
            <RefreshCw className="w-3 h-3" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </section>
  )
}
