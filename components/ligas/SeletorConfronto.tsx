'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Swords, Loader2, Calendar } from 'lucide-react'
import { useProximasPartidas } from '@/lib/hooks/useProximasPartidas'

import Image from 'next/image'

export interface SeletorConfrontoProps {
  slug: string
  times: Array<{ id: string; name: string; shortName: string | null; logoUrl: string | null }>
  onConfrontoDefinido: (mandanteId: string, visitanteId: string, fixtureId?: string) => void
  onCalcular: () => void
  isCalculando: boolean
}

export function SeletorConfronto({
  slug,
  times,
  onConfrontoDefinido,
  onCalcular,
  isCalculando
}: SeletorConfrontoProps) {
  const { partidas, loading, error } = useProximasPartidas(slug, 2)
  
  const [mandanteId, setMandanteId] = useState<string | null>(null)
  const [visitanteId, setVisitanteId] = useState<string | null>(null)
  const [fixtureId, setFixtureId] = useState<string | undefined>(undefined)

  const handleSelectMandante = (id: string) => {
    setMandanteId(id)
    setFixtureId(undefined) // Limpa fixtureId pois é seleção manual
    if (visitanteId) {
      onConfrontoDefinido(id, visitanteId, undefined)
    }
  }

  const handleSelectVisitante = (id: string) => {
    setVisitanteId(id)
    setFixtureId(undefined) // Limpa fixtureId pois é seleção manual
    if (mandanteId) {
      onConfrontoDefinido(mandanteId, id, undefined)
    }
  }

  const handleCliqueFutura = (partida: any) => {
    setMandanteId(partida.homeTeam.id)
    setVisitanteId(partida.awayTeam.id)
    setFixtureId(partida.id)
    onConfrontoDefinido(partida.homeTeam.id, partida.awayTeam.id, partida.id)
  }

  const podeCalcular = mandanteId !== null && visitanteId !== null

  const timesOptionsCasa = times.filter(t => t.id !== visitanteId)
  const timesOptionsVisitante = times.filter(t => t.id !== mandanteId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
      {/* Coluna Esquerda: Próximas Partidas */}
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Próximas Partidas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-y-auto max-h-[260px]">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-destructive">{error}</div>
          ) : partidas.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
              <Calendar className="w-8 h-8 mb-3 opacity-20" />
              <p>Nenhuma partida agendada encontrada.</p>
              <p className="text-xs mt-1">Utilize a seleção manual ao lado.</p>
            </div>
          ) : (
            <div className="divide-y">
              {partidas.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleCliqueFutura(p)}
                  className={`w-full p-4 flex flex-col hover:bg-muted/50 transition-colors text-left ${fixtureId === p.id ? 'bg-muted border-l-4 border-l-primary' : ''}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">Rodada {p.round}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {p.homeTeam.logo ? (
                        <div className="w-5 h-5 relative shrink-0">
                          <Image src={p.homeTeam.logo} alt={p.homeTeam.name} fill className="object-contain" />
                        </div>
                      ) : <div className="w-5 h-5 bg-muted rounded-full shrink-0" />}
                      <span className="text-sm font-medium truncate">{p.homeTeam.shortName || p.homeTeam.name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground px-1 uppercase">vs</span>
                    <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                      <span className="text-sm font-medium truncate text-right">{p.awayTeam.shortName || p.awayTeam.name}</span>
                      {p.awayTeam.logo ? (
                        <div className="w-5 h-5 relative shrink-0">
                          <Image src={p.awayTeam.logo} alt={p.awayTeam.name} fill className="object-contain" />
                        </div>
                      ) : <div className="w-5 h-5 bg-muted rounded-full shrink-0" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coluna Direita: Escolha Manual */}
      <Card className="flex flex-col shadow-sm">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Swords className="w-4 h-4" />
            Escolha de Confronto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            {/* Selects */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mandante</label>
                <Select value={mandanteId || undefined} onValueChange={handleSelectMandante}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o mandante" />
                  </SelectTrigger>
                  <SelectContent>
                    {timesOptionsCasa.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-full bg-muted mt-5">
                <span className="text-xs font-semibold text-muted-foreground">VS</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Visitante</label>
                <Select value={visitanteId || undefined} onValueChange={handleSelectVisitante}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o visitante" />
                  </SelectTrigger>
                  <SelectContent>
                    {timesOptionsVisitante.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resumo */}
            {podeCalcular && (
              <div className="bg-muted/30 rounded-lg p-4 border border-dashed flex flex-col items-center justify-center gap-3">
                <div className="flex items-center justify-center gap-4 text-center">
                  <span className="font-semibold">{times.find(t => t.id === mandanteId)?.name}</span>
                  <span className="text-muted-foreground font-light text-sm">x</span>
                  <span className="font-semibold">{times.find(t => t.id === visitanteId)?.name}</span>
                </div>
              </div>
            )}
          </div>

          <Button 
            size="lg" 
            className="w-full mt-auto"
            disabled={!podeCalcular || isCalculando}
            onClick={onCalcular}
          >
            {isCalculando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando Previsão...
              </>
            ) : (
              'Calcular Previsão'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
