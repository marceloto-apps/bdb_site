"use client"

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

type ReadingTrackerProps = {
  articleId: string
}

export function ReadingTracker({ articleId }: ReadingTrackerProps) {
  const { status } = useSession()
  const firedRef = useRef(false)

  useEffect(() => {
    if (firedRef.current) return
    if (status !== 'authenticated') return
    firedRef.current = true

    fetch('/api/historico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    }).catch((err) => {
      // Silencioso: não polui o usuário com erro de tracking
      console.warn('[ReadingTracker] Falha ao registrar leitura:', err)
    })
  }, [articleId, status])

  return null
}
