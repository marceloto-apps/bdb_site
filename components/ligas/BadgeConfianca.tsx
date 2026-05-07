import React from 'react'
import { cn } from '@/lib/utils'

export function BadgeConfianca({ nivel }: { nivel: 'ALTA' | 'MEDIA' | 'BAIXA' }) {
  const config = {
    ALTA:  { label: 'Alta', color: 'bg-green-500/20 text-green-500 border-green-500/30' },
    MEDIA: { label: 'Média', color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
    BAIXA: { label: 'Baixa', color: 'bg-red-500/20 text-red-500 border-red-500/30' },
  }
  const c = config[nivel]
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded border", c.color)}>
      {c.label}
    </span>
  )
}
