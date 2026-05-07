'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Database, AlertCircle } from 'lucide-react'
import { SyncLogTable } from './SyncLogTable'

interface SyncPanelProps {
  seasons: Array<{ id: string; year: string; competitionName: string }>
}

export function SyncPanel({ seasons }: SyncPanelProps) {
  const [seasonId, setSeasonId] = useState<string>(seasons[0]?.id || '')
  const [maxPartidas, setMaxPartidas] = useState(10)
  
  const [isSyncingPartidas, setIsSyncingPartidas] = useState(false)
  const [isSyncingOdds, setIsSyncingOdds] = useState(false)
  
  const [partidasResult, setPartidasResult] = useState<any>(null)
  const [oddsResult, setOddsResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const [syncLogs, setSyncLogs] = useState<any[]>([])

  const fetchStatus = useCallback(async () => {
    if (!seasonId) return
    try {
      const res = await fetch(`/api/admin/sync/status?seasonId=${seasonId}`)
      if (res.ok) {
        const json = await res.json()
        setSyncLogs(json.data)
      }
    } catch (e) {
      console.error('Failed to fetch sync status', e)
    }
  }, [seasonId])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const handleSyncPartidas = async () => {
    if (!seasonId) return
    setIsSyncingPartidas(true)
    setError(null)
    setPartidasResult(null)
    try {
      const res = await fetch('/api/admin/sync/partidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || json.error || 'Erro na sincronização')
      setPartidasResult(json.data.result)
      fetchStatus()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSyncingPartidas(false)
    }
  }

  const handleSyncOdds = async () => {
    if (!seasonId) return
    setIsSyncingOdds(true)
    setError(null)
    setOddsResult(null)
    try {
      const res = await fetch('/api/admin/sync/odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId, maxPartidas })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || json.error || 'Erro na sincronização')
      setOddsResult(json.data.result)
      fetchStatus()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSyncingOdds(false)
    }
  }

  const ultimoLog = syncLogs[0]

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm border-border">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Sincronização de Dados
            </CardTitle>
            <CardDescription className="mt-1">
              Atualize partidas e odds manualmente via API-Football
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Temporada:</span>
            <Select value={seasonId} onValueChange={setSeasonId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma temporada" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.competitionName} {s.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 space-y-6">
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Partidas */}
          <div className="p-4 border rounded-md bg-muted/20 flex flex-col gap-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4" /> Sync Partidas
              </h4>
              <p className="text-sm text-muted-foreground">
                Atualiza resultados e status de todos os jogos da temporada atual.
              </p>
            </div>
            
            <div className="mt-auto pt-4 flex flex-col gap-3">
              <Button 
                onClick={handleSyncPartidas} 
                disabled={isSyncingPartidas || isSyncingOdds || !seasonId}
                className="w-full"
              >
                {isSyncingPartidas ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sincronizando...</>
                ) : (
                  'Sincronizar Partidas'
                )}
              </Button>
              
              {partidasResult && (
                <div className="text-sm p-3 bg-card border rounded-md font-mono">
                  <div className="text-green-500 font-bold mb-1">Concluído!</div>
                  <div>Criados: {partidasResult.created}</div>
                  <div>Atualizados: {partidasResult.updated}</div>
                  {partidasResult.errors?.length > 0 && (
                    <div className="text-red-500 mt-1">{partidasResult.errors.length} erros ocorridos.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card Odds */}
          <div className="p-4 border rounded-md bg-muted/20 flex flex-col gap-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4" /> Sync Odds (Pinnacle)
              </h4>
              <p className="text-sm text-muted-foreground">
                Busca odds para os jogos que ainda não possuem cotações salvas.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Qtd:</span>
              <Input 
                type="number" 
                value={maxPartidas} 
                onChange={(e) => setMaxPartidas(parseInt(e.target.value) || 10)}
                min={1} 
                max={30}
                className="w-20"
                disabled={isSyncingOdds}
              />
              <span className="text-xs text-muted-foreground">(Máx 30/vez)</span>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <Button 
                onClick={handleSyncOdds} 
                disabled={isSyncingOdds || isSyncingPartidas || !seasonId}
                className="w-full"
                variant="secondary"
              >
                {isSyncingOdds ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sincronizando...</>
                ) : (
                  'Sincronizar Odds'
                )}
              </Button>
              
              {oddsResult && (
                <div className="text-sm p-3 bg-card border rounded-md font-mono">
                  <div className="text-green-500 font-bold mb-1">Concluído!</div>
                  <div>Jogos com Odds: {oddsResult.withOdds} / {oddsResult.total}</div>
                  <div>Registros criados: {oddsResult.created}</div>
                  <div className="text-muted-foreground text-xs mt-1">Requests: {oddsResult.requestsUsed}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {ultimoLog && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            Último sync ({ultimoLog.type}): {new Date(ultimoLog.createdAt).toLocaleString()} · Status: {ultimoLog.status}
          </div>
        )}

        <div className="mt-4">
          <SyncLogTable logs={syncLogs} />
        </div>

      </CardContent>
    </Card>
  )
}
