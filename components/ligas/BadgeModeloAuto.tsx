'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ModeloRankingUI } from '@/types/liga'
import { Sparkles } from 'lucide-react'

interface BadgeModeloAutoProps {
  modelo: ModeloRankingUI['modelo']
  confianca: ModeloRankingUI['confianca']
  size?: 'sm' | 'default'
}

export function BadgeModeloAuto({ modelo, confianca, size = 'default' }: BadgeModeloAutoProps) {
  const mapModelo: Record<string, string> = {
    'POISSON': 'Poisson',
    'ZIP': 'Zero-Inflated',
    'NB': 'Binomial Negativa',
    'DIXON_COLES': 'Dixon-Coles',
  }

  const mapConfianca = {
    ALTA: { color: 'bg-green-900/30 text-green-400 border-green-700', label: 'Alta' },
    MEDIA: { color: 'bg-yellow-900/30 text-yellow-400 border-yellow-700', label: 'Média' },
    BAIXA: { color: 'bg-red-900/30 text-red-400 border-red-700', label: 'Baixa' },
  }

  const confInfo = mapConfianca[confianca]

  const isSm = size === 'sm'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`cursor-default flex items-center gap-1.5 ${isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${confInfo.color}`}
          >
            <Sparkles className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
            <span>
              {mapModelo[modelo] || modelo} • Confiança: {confInfo.label}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">
            Modelo selecionado automaticamente via AIC (Critério de Informação de Akaike).
            Confiança {confInfo.label} indica a distância estatística para o segundo melhor modelo.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
