import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvisoPrevisaoIndisponivelProps {
  /** O que ficaria neste lugar: "Modelos e λ", "Probabilidades do modelo"… */
  titulo: string
  motivo?: string
  className?: string
}

/** Ocupa o lugar de um bloco de projeção quando a amostra não sustenta a previsão. */
export function AvisoPrevisaoIndisponivel({ titulo, motivo, className }: AvisoPrevisaoIndisponivelProps) {
  return (
    <div className={cn(
      'flex h-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed bg-muted/20 p-6 text-center',
      className
    )}>
      <AlertCircle className="h-5 w-5 text-yellow-500" />
      <p className="text-sm font-semibold">{titulo}: dados insuficientes para previsão</p>
      {motivo && <p className="max-w-xl text-xs text-muted-foreground">{motivo}</p>}
    </div>
  )
}
