'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

export interface PartidaFutura {
  id: string
  round: string
  date: string
  /** displayName: nome revisado, senão curto, senão nome (lib/utils/team-name.ts) */
  homeTeam: { id: string; name: string; shortName: string | null; displayName: string; logo: string | null }
  awayTeam: { id: string; name: string; shortName: string | null; displayName: string; logo: string | null }
}

export interface UseProximasPartidasReturn {
  partidas: PartidaFutura[]
  rodadaAtual: string | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProximasPartidas(slug: string, rodadas: number = 2): UseProximasPartidasReturn {
  const [partidas, setPartidas] = useState<PartidaFutura[]>([])
  const [rodadaAtual, setRodadaAtual] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Cache simples para evitar refetch no mesmo slug/rodadas
  const cacheKey = useRef<string | null>(null)

  const carregarPartidas = useCallback(async (force: boolean = false) => {
    if (!slug) return
    
    const currentCacheKey = `${slug}-${rodadas}`
    
    // Se não forçamos recarregamento e a chave do cache bater, aborta fetch duplicado
    if (!force && cacheKey.current === currentCacheKey) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ligas/${slug}/partidas/proximas?rodadas=${rodadas}`)
      const json = await res.json()
      
      if (!res.ok) {
        throw new Error(json.error || json.message || 'Erro ao buscar próximas partidas')
      }
      
      setPartidas(json.data.partidas)
      setRodadaAtual(json.data.rodadaAtual)
      cacheKey.current = currentCacheKey // Salva o cache state
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setPartidas([])
      setRodadaAtual(null)
    } finally {
      setLoading(false)
    }
  }, [slug, rodadas])

  useEffect(() => {
    carregarPartidas()
  }, [carregarPartidas])

  const refetch = useCallback(() => carregarPartidas(true), [carregarPartidas])

  return { partidas, rodadaAtual, loading, error, refetch }
}
