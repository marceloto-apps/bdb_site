'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ModoModelo } from '@/types/liga'
import { Info, AlertTriangle, Sparkles } from 'lucide-react'

interface SeletorModeloProps {
  modo: ModoModelo
  onChange: (modo: ModoModelo) => void
  warnings?: string[]
  modeloSelecionado?: string
  vereditoDispersao?: string
  sinaisTriagem?: {
    zip: 'FORTE' | 'LEVE' | 'AUSENTE' | 'INDETERMINADO'
    dc: 'INDICADO' | 'AUSENTE' | 'INDETERMINADO'
    detalhesDispersao?: {
      indice: number
      faixaInf: number
      faixaSup: number
    }
  }
}

export function SeletorModelo({
  modo,
  onChange,
  warnings = [],
  modeloSelecionado,
  vereditoDispersao,
  sinaisTriagem
}: SeletorModeloProps) {
  
  const models = [
    { 
      key: 'AUTO' as ModoModelo, 
      label: 'Automático', 
      sublabel: '(recomendado)',
      desc: 'Seleciona automaticamente o melhor modelo combinando diagnóstico de dispersão condicional e critério de informação de Akaike (AIC) com regras de robustez.' 
    },
    { key: 'POISSON' as ModoModelo, label: 'Poisson Simples', desc: 'Modelo clássico — médias puras da liga (compatível com a planilha)' },
    { key: 'DIXON_COLES' as ModoModelo, label: 'Dixon-Coles', desc: 'Aplica decaimento temporal e corrige placares baixos correlacionados (ex: 1x0, 0x0)' },
    { key: 'ZIP' as ModoModelo, label: 'ZIP', desc: 'Corrige excesso de jogos 0×0 em ligas com perfil defensivo' },
    { key: 'NB' as ModoModelo, label: 'Bin. Negativa', desc: 'Modela variância alta nos gols (superdispersão) típica de ligas desequilibradas' },
  ]

  const nbWarning = warnings.find(w => w.includes('NB Warning'))

  const formatModelName = (model: string) => {
    const map: Record<string, string> = {
      'POISSON': 'Poisson Simples',
      'DIXON_COLES': 'Dixon-Coles',
      'ZIP': 'Zero-Inflated Poisson (ZIP)',
      'NB': 'Binomial Negativa',
    }
    return map[model] || model
  }

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
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 flex-1">
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
                    {m.sublabel && (
                      <span className="text-[10px] text-primary/80 font-medium">
                        {m.sublabel}
                      </span>
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

        {modo === 'AUTO' && modeloSelecionado && (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
                <span>
                  Automático → <strong className="text-foreground">{formatModelName(modeloSelecionado)}</strong> selecionado
                </span>
              </span>
              {vereditoDispersao && (
                <span className="text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-1.5 text-right sm:text-left">
                  <span>veredito: <strong className="text-foreground uppercase">{vereditoDispersao}</strong></span>
                  {sinaisTriagem?.detalhesDispersao && (
                    <span className="text-[10px] font-mono text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border">
                      D={sinaisTriagem.detalhesDispersao.indice.toFixed(2)} (banda {sinaisTriagem.detalhesDispersao.faixaInf.toFixed(2)}–{sinaisTriagem.detalhesDispersao.faixaSup.toFixed(2)})
                    </span>
                  )}
                </span>
              )}
            </div>

            {sinaisTriagem &&
              sinaisTriagem.zip !== 'INDETERMINADO' &&
              (sinaisTriagem.zip === 'FORTE' || sinaisTriagem.dc === 'INDICADO') && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/70 flex flex-col gap-1.5 animate-in fade-in duration-300">
                  {sinaisTriagem.zip === 'FORTE' && (
                    <p className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span>A liga apresenta forte excesso de zeros (jogos sem gols) na marginal, indicando o Zero-Inflated Poisson.</span>
                    </p>
                  )}
                  {sinaisTriagem.dc === 'INDICADO' && (
                    <p className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                      <span>Distorção significativa em placares baixos e correlação relevante (&rho;), indicando o Dixon-Coles.</span>
                    </p>
                  )}
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
