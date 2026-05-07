'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BadgeModeloAuto } from './BadgeModeloAuto'
import { ModoModelo, ModeloRankingUI } from '@/types/liga'
import { Info, AlertTriangle } from 'lucide-react'

interface SeletorModeloProps {
  modo: ModoModelo
  modeloAutoResult: ModeloRankingUI | null
  onChange: (modo: ModoModelo) => void
  warnings?: string[]
}

export function SeletorModelo({ modo, modeloAutoResult, onChange, warnings = [] }: SeletorModeloProps) {
  
  const models = [
    { key: 'AUTO' as ModoModelo, label: 'AUTO (AIC)', desc: 'Avalia qual modelo estatístico melhor explica o cenário recente da liga baseado em métricas de probabilidade máxima (AIC).' },
    { key: 'POISSON' as ModoModelo, label: 'Poisson Simples', desc: 'Modelo clássico — médias puras da liga (compatível com a planilha)' },
    { key: 'DIXON_COLES' as ModoModelo, label: 'Dixon-Coles', desc: 'Aplica decaimento temporal e corrige placares baixos correlacionados (ex: 1x0, 0x0)' },
    { key: 'ZIP' as ModoModelo, label: 'ZIP', desc: 'Corrige excesso de jogos 0×0 em ligas com perfil defensivo' },
    { key: 'NB' as ModoModelo, label: 'Bin. Negativa', desc: 'Modela variância alta nos gols (superdispersão) típica de ligas desequilibradas' },
  ]

  const nbWarning = warnings.find(w => w.includes('NB Warning'))

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight text-center uppercase text-muted-foreground flex items-center justify-center gap-2">
          Modelo Estatístico
          {nbWarning && (
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">{nbWarning}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3 flex-1">
          {models.map((m) => {
            const isAtivo = modo === m.key
            return (
              <div 
                key={m.key} 
                className={`flex flex-col h-full gap-2 p-3 rounded-lg border bg-card transition-all ${isAtivo ? 'border-l-4 border-l-primary border-primary/20 bg-primary/5' : 'border-border/50'}`}
              >
                <div className="flex items-start justify-between min-h-[32px]">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight pr-1">
                      {m.label}
                    </span>
                    {m.key === 'AUTO' && modeloAutoResult && isAtivo && (
                      <div className="mt-1">
                        <BadgeModeloAuto modelo={modeloAutoResult.modelo} confianca={modeloAutoResult.confianca} size="sm" />
                      </div>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help shrink-0 mt-0.5" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[200px]">{m.desc}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <Button
                  variant={isAtivo ? 'default' : 'outline'}
                  size="sm"
                  className="mt-auto w-full text-xs h-8"
                  onClick={() => onChange(m.key)}
                >
                  {isAtivo ? '● Ativo' : 'Selecionar'}
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
