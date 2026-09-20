'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, ChevronRight, Activity, Clock } from 'lucide-react'
import type { MatchItem } from '@/lib/dashboard/jogos-do-dia'

interface DashboardMatchCardProps {
  match: MatchItem
}

export function DashboardMatchCard({ match }: DashboardMatchCardProps) {
  const { homeTeam, awayTeam, competition, horaSP, round, hasXg, status } = match

  const isPostponed = status === 'POSTPONED'

  return (
    <div className="bg-surface/80 hover:bg-surface border border-border hover:border-primary/40 rounded-xl p-4 transition-all duration-200 shadow-xs flex flex-col justify-between gap-3 group">
      {/* Header do Card: Liga, Rodada e Selo */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-border/50">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <Trophy className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-text-secondary truncate">
            {competition.name}
          </span>
          {round != null && (
            <span className="text-muted-foreground shrink-0">
              • Rodada {round}
            </span>
          )}
        </div>

        <Badge
          variant="outline"
          className={
            competition.tier === 'FREE'
              ? 'bg-green-500/10 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0 font-medium'
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0 font-medium'
          }
        >
          {competition.tier}
        </Badge>
      </div>

      {/* Corpo Central: Confronto e Horário */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1">
        {/* Time Mandante */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-background/80 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden relative">
            {homeTeam.logoUrl ? (
              <Image
                src={homeTeam.logoUrl}
                alt={homeTeam.displayName}
                width={24}
                height={24}
                className="object-contain"
                unoptimized
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {homeTeam.displayName.slice(0, 2)}
              </span>
            )}
          </div>
          <span
            className="font-medium text-sm text-text-primary truncate"
            title={homeTeam.displayName}
          >
            {homeTeam.displayName}
          </span>
        </div>

        {/* Centro: Horário do Confronto */}
        <div className="flex flex-col items-center justify-center px-2 min-w-[70px]">
          {isPostponed ? (
            <Badge
              variant="outline"
              className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30"
            >
              Adiado
            </Badge>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-mono font-bold text-base text-primary">
                {horaSP}
              </span>
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                Brasília
              </span>
            </div>
          )}
        </div>

        {/* Time Visitante */}
        <div className="flex items-center justify-end gap-2.5 min-w-0">
          <span
            className="font-medium text-sm text-text-primary truncate text-right"
            title={awayTeam.displayName}
          >
            {awayTeam.displayName}
          </span>
          <div className="w-8 h-8 rounded-full bg-background/80 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden relative">
            {awayTeam.logoUrl ? (
              <Image
                src={awayTeam.logoUrl}
                alt={awayTeam.displayName}
                width={24}
                height={24}
                className="object-contain"
                unoptimized
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {awayTeam.displayName.slice(0, 2)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rodapé do Card: Tags e Link da Liga */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs mt-1">
        <div className="flex items-center gap-2">
          {hasXg && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded">
              <Activity className="w-2.5 h-2.5" />
              xG
            </span>
          )}
        </div>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 ml-auto"
        >
          <Link href={`/dashboard/ligas/${competition.slug}`}>
            Analisar Liga
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
