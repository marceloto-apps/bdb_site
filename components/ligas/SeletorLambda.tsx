'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { LambdaMethod, LambdasCalculados, LambdaComposicao } from '@/lib/analytics/types'

interface SeletorLambdaProps {
  todosLambdas: LambdasCalculados
  composicao: LambdaComposicao
  lambdaAtivo: LambdaMethod
  xgDisponivel: boolean
  onChange: (method: LambdaMethod) => void
}

export function SeletorLambda({
  todosLambdas,
  lambdaAtivo,
  xgDisponivel,
  onChange,
}: SeletorLambdaProps) {
  
  const formatVal = (val?: number) => typeof val === 'number' ? val.toFixed(2) : '--'



  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold tracking-tight text-center uppercase text-muted-foreground">
          Lambdas do Confronto
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 flex-1">
          {/* MÉDIA SIMPLES */}
          <div className={`flex flex-col h-full gap-3 p-4 rounded-lg border bg-card transition-all ${lambdaAtivo === 'MEDIA_SIMPLES' ? 'border-l-4 border-l-primary border-primary/20 bg-primary/5' : 'border-border/50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Média Simples</span>
            </div>
            <div className="flex flex-col font-mono text-base font-bold gap-1 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-sans font-normal">λH:</span>
                <span className="text-green-500">{formatVal(todosLambdas.mediaSimples.lambdaH)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-sans font-normal">λA:</span>
                <span className="text-blue-500">{formatVal(todosLambdas.mediaSimples.lambdaA)}</span>
              </div>
            </div>
            <Button
              variant={lambdaAtivo === 'MEDIA_SIMPLES' ? 'default' : 'outline'}
              size="sm"
              className="mt-auto w-full text-xs h-8"
              onClick={() => onChange('MEDIA_SIMPLES')}
            >
              {lambdaAtivo === 'MEDIA_SIMPLES' ? '● Ativo' : 'Selecionar'}
            </Button>
          </div>

          {/* FORÇAS RELATIVAS */}
          <div className={`flex flex-col h-full gap-3 p-4 rounded-lg border bg-card transition-all ${lambdaAtivo === 'FORCAS_RELATIVAS' ? 'border-l-4 border-l-primary border-primary/20 bg-primary/5' : 'border-border/50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Forças Relativas</span>
            </div>
            <div className="flex flex-col font-mono text-base font-bold gap-1 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-sans font-normal">λH:</span>
                <span className="text-green-500">{formatVal(todosLambdas.forcasRelativas.lambdaH)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-sans font-normal">λA:</span>
                <span className="text-blue-500">{formatVal(todosLambdas.forcasRelativas.lambdaA)}</span>
              </div>
            </div>
            <Button
              variant={lambdaAtivo === 'FORCAS_RELATIVAS' ? 'default' : 'outline'}
              size="sm"
              className="mt-auto w-full text-xs h-8"
              onClick={() => onChange('FORCAS_RELATIVAS')}
            >
              {lambdaAtivo === 'FORCAS_RELATIVAS' ? '● Ativo' : 'Selecionar'}
            </Button>
          </div>

          {/* EXPECTED GOALS (xG) */}
          <div className={`flex flex-col h-full gap-3 p-4 rounded-lg border transition-all ${!xgDisponivel ? 'opacity-60 bg-muted/30 grayscale-[50%]' : lambdaAtivo === 'XG' ? 'border-l-4 border-l-primary border-primary/20 bg-primary/5' : 'bg-card border-border/50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Expected Goals (xG)</span>
            </div>
            <div className="flex flex-col font-mono text-base font-bold gap-1 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-sans font-normal">λH:</span>
                <span className="text-green-500">{formatVal(todosLambdas.xg?.lambdaH)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-sans font-normal">λA:</span>
                <span className="text-blue-500">{formatVal(todosLambdas.xg?.lambdaA)}</span>
              </div>
            </div>

            {xgDisponivel ? (
              <Button
                variant={lambdaAtivo === 'XG' ? 'default' : 'outline'}
                size="sm"
                className="mt-auto w-full text-xs h-8"
                onClick={() => onChange('XG')}
              >
                {lambdaAtivo === 'XG' ? '● Ativo' : 'Selecionar'}
              </Button>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="mt-auto w-full text-xs h-8 border border-dashed border-muted-foreground/30"
                      >
                        Indisponível
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">Dados de xG não encontrados ou amostra insuficiente (mín. 20 jogos) nesta liga.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
