// components/ligas/PainelDispersao.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import type {
  DispersaoLigaResponse,
  DispersaoMetricaResponse,
  VeredictoDispersao,
} from '@/types/liga'

// Cor do badge por veredito (tokens data.* do design system)
function corVeredito(v: VeredictoDispersao): string {
  if (v === 'OVER') return 'bg-data-red/20 text-data-red border-data-red/40'
  if (v === 'UNDER') return 'bg-data-blue/20 text-data-blue border-data-blue/40'
  return 'bg-primary/20 text-primary border-primary/40'
}

function rotuloVeredito(v: VeredictoDispersao): string {
  if (v === 'OVER') return 'Over'
  if (v === 'UNDER') return 'Under'
  return 'Poisson'
}

function rotuloDistribuicao(d: string): string {
  if (d === 'NB') return 'Binomial Negativa'
  if (d === 'COM_POISSON') return 'COM-Poisson'
  return 'Poisson'
}

function LinhaMetrica({ m }: { m: DispersaoMetricaResponse }) {
  const rotulo = m.metrica === 'GOLS' ? 'GOLS' : 'xG'
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
      <span className="w-12 text-text-muted">{rotulo}</span>

      <span className="text-text-secondary">Agregado:</span>
      <span className="text-text-primary font-semibold">{m.agregado.indice.toFixed(2)}</span>
      <Badge
        variant="outline"
        className={`px-1.5 py-0 text-[10px] ${corVeredito(m.agregado.veredito)}`}
      >
        {rotuloVeredito(m.agregado.veredito)}
      </Badge>

      <span className="mx-1 text-border">|</span>

      <span className="text-text-secondary">Condicional:</span>
      <span className="text-text-primary font-semibold">{m.condicional.indice.toFixed(2)}</span>
      <Badge
        variant="outline"
        className={`px-1.5 py-0 text-[10px] ${corVeredito(m.condicional.veredito)}`}
      >
        {rotuloVeredito(m.condicional.veredito)}
      </Badge>

      {m.alertaAmostra && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-data-yellow cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs bg-surface border border-border text-text-primary">
              {m.alertaAmostra}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

export function PainelDispersao({ 
  data,
  mediasLigaGols,
  mediasLigaXG,
  xgDisponivel
}: { 
  data: DispersaoLigaResponse
  mediasLigaGols?: { muH: number; varH: number; muA: number; varA: number }
  mediasLigaXG?: { muH: number; varH: number; muA: number; varA: number } | null
  xgDisponivel?: boolean
}) {
  const { sugestaoFinal } = data
  const mostrarMedias = !!mediasLigaGols

  return (
    <div className="rounded-md border border-border bg-surface/50 p-3 space-y-3 mt-3">
      <div className="flex items-center gap-2 border-b border-border/40 pb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
          Diagnóstico e Médias da Liga
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-text-muted cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent className="max-w-sm text-xs bg-surface border border-border text-text-primary">
              O índice agregado mistura dispersão real com heterogeneidade entre
              confrontos. O índice condicional desconta o λ esperado de cada jogo
              (resíduos de Pearson) e é o critério correto para escolher a distribuição.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className={mostrarMedias ? "grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6" : "space-y-3"}>
        {/* Bloco de Médias da Liga (só se fornecido) */}
        {mostrarMedias && (
          <div className="space-y-1.5 lg:border-r lg:border-border/40 lg:pr-4 lg:col-span-3">
            <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Médias da Liga</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-text-muted font-bold">GOLS:</span>
                <span className="text-foreground">
                  H: <span className="font-semibold">{mediasLigaGols.muH.toFixed(2)}</span> <span className="text-[10px] text-text-muted">({mediasLigaGols.varH.toFixed(2)})</span> | 
                  A: <span className="font-semibold">{mediasLigaGols.muA.toFixed(2)}</span> <span className="text-[10px] text-text-muted">({mediasLigaGols.varA.toFixed(2)})</span>
                </span>
              </div>
              {xgDisponivel && mediasLigaXG && (
                <div className="flex justify-between items-center text-xs font-mono border-t border-dashed border-border/50 pt-1.5">
                  <span className="text-text-muted font-bold">xG:</span>
                  <span className="text-foreground">
                    H: <span className="font-semibold">{mediasLigaXG.muH.toFixed(2)}</span> <span className="text-[10px] text-text-muted">({mediasLigaXG.varH.toFixed(2)})</span> | 
                    A: <span className="font-semibold">{mediasLigaXG.muA.toFixed(2)}</span> <span className="text-[10px] text-text-muted">({mediasLigaXG.varA.toFixed(2)})</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bloco de Dispersão */}
        <div className={mostrarMedias ? "lg:col-span-5 space-y-2 lg:border-r lg:border-border/40 lg:pr-4" : "space-y-2"}>
          {mostrarMedias && (
            <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Diagnóstico de Dispersão (Agregado | Condicional)</div>
          )}
          <LinhaMetrica m={data.gols} />
          {data.xg && <LinhaMetrica m={data.xg} />}
        </div>

        {/* Bloco de Sugestão Final */}
        <div className="space-y-1 lg:col-span-4">
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">Sugestão do Motor</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs">💡</span>
            <span className="text-xs text-text-muted font-medium">Sugestão:</span>
            <span className="font-semibold text-xs text-primary">
              {rotuloDistribuicao(sugestaoFinal.distribuicao)}
            </span>
            <Badge
              variant="outline"
              className="px-1 py-0 text-[8px] border-border text-text-muted font-mono"
            >
              {sugestaoFinal.confianca}
            </Badge>
          </div>
          <p className="text-[10px] text-text-muted leading-snug mt-1">
            {sugestaoFinal.explicacao}
          </p>
        </div>
      </div>
    </div>
  )
}
