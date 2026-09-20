'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
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
import { Calendar, Search, Filter, RefreshCw, X, Trophy } from 'lucide-react'
import type { MatchItem, LeagueFilterOption } from '@/lib/dashboard/jogos-do-dia'

interface DashboardJogosDoDiaProps {
  initialPartidas: MatchItem[]
  ligas: LeagueFilterOption[]
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
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE)

  // As principais ligas com jogos a acontecer hoje para as pílulas de 1 clique
  const topLigasPills = useMemo(() => {
    return ligas.slice(0, 5)
  }, [ligas])

  // Filtragem dinâmica de partidas
  const filteredMatches = useMemo(() => {
    return initialPartidas.filter((match) => {
      // Filtro de liga
      if (selectedLeague !== 'all' && match.competition.slug !== selectedLeague) {
        return false
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
  }, [initialPartidas, selectedLeague, searchQuery])

  const displayedMatches = filteredMatches.slice(0, visibleCount)
  const hasMore = visibleCount < filteredMatches.length

  const handleResetFilters = () => {
    setSelectedLeague('all')
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
              Jogos de Hoje
            </h2>
            {initialPartidas.length > 0 && (
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 text-xs py-0.5"
              >
                {filteredMatches.length}{' '}
                {filteredMatches.length === 1 ? 'partida a acontecer' : 'partidas a acontecer'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            {dataReferencia.dataCompleta} • Horário de Brasília
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

      {/* Barra de Filtros (Pílulas de Ligas + Campo de Busca) */}
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
                ? 'bg-primary text-black font-semibold shadow-xs'
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
                selectedLeague === liga.slug
                  ? 'bg-primary text-black font-semibold shadow-xs'
                  : 'bg-surface hover:bg-muted text-muted-foreground hover:text-white border border-border/80'
              }`}
            >
              {liga.name} ({liga.totalJogos})
            </button>
          ))}
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative w-full md:w-64 shrink-0">
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
              Nenhum jogo a ser realizado hoje
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {searchQuery || selectedLeague !== 'all'
                ? 'Nenhuma partida correspondente aos filtros selecionados. Tente limpar os filtros ou selecionar outra liga.'
                : 'Não há mais partidas programadas para hoje nas suas ligas ou todos os jogos de hoje já foram iniciados.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            {(searchQuery || selectedLeague !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Limpar Filtros
              </Button>
            )}
            <Button asChild size="sm" variant="ghost" className="text-xs gap-1.5 text-primary">
              <Link href="/dashboard/ligas">
                <Trophy className="w-3.5 h-3.5" />
                Ver Catálogo de Ligas
              </Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
