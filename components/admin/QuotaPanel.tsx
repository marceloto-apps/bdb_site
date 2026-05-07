'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gauge, RefreshCw } from 'lucide-react'

export function QuotaPanel() {
  const [quota, setQuota] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuota = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/quota')
      if (res.ok) {
        const json = await res.json()
        setQuota(json.data)
      } else {
        const json = await res.json()
        setError(json.error || 'Erro ao carregar quota')
      }
    } catch (e) {
      setError('Falha de conexão')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuota()
    const interval = setInterval(fetchQuota, 5 * 60 * 1000) // 5 minutos
    return () => clearInterval(interval)
  }, [fetchQuota])

  const getProgressColor = (pct: number) => {
    if (pct < 50) return 'bg-green-500'
    if (pct < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm border-border">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-primary" />
            Uso da API-Football
          </div>
          <Button variant="outline" size="sm" onClick={fetchQuota} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 space-y-6">
        {error ? (
          <div className="text-center p-4 bg-red-500/10 text-red-500 rounded-md">
            {error}
          </div>
        ) : quota ? (
          <div className="space-y-6">
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-lg">{quota.used} / {quota.limit} requests</span>
              <span className="text-sm font-mono">{quota.percentage.toFixed(1)}%</span>
            </div>
            
            <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getProgressColor(quota.percentage)}`} 
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-6 pt-4 border-t border-border/50">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Restantes hoje:</span>
                <span className="font-mono font-bold text-lg">{quota.remaining}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Última atualização:</span>
                <span className="text-muted-foreground">
                  {new Date(quota.lastUpdated).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center p-6">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
