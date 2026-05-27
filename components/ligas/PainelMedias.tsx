'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import { BadgeConfianca } from './BadgeConfianca'
import { cn } from '@/lib/utils'
import type { MediasTimeXG, ForcasTimeXG, MediasLigaXG } from '@/lib/analytics/types'
import type { MediasTime, ForcasTime } from '@/lib/analytics/forca-time'
import type { MediasLigaCalculadas } from '@/lib/analytics/medias'

interface PainelMediasProps {
  medias: {
    home: MediasTime
    away: MediasTime
    liga: MediasLigaCalculadas & { totalJogos: number }
  }
  forcas: {
    home: ForcasTime
    away: ForcasTime
  }
  homeTeamName: string
  awayTeamName: string

  mediasHomeXG?: MediasTimeXG | null
  mediasAwayXG?: MediasTimeXG | null
  forcasHomeXG?: ForcasTimeXG | null
  forcasAwayXG?: ForcasTimeXG | null
  ligaMediasXG?: MediasLigaXG | null
  xgDisponivel: boolean
}

export function PainelMedias({ 
  medias, 
  forcas, 
  homeTeamName, 
  awayTeamName,
  mediasHomeXG,
  mediasAwayXG,
  forcasHomeXG,
  forcasAwayXG,
  ligaMediasXG,
  xgDisponivel 
}: PainelMediasProps) {
  const renderForca = (valor: number) => {
    const isHigh = valor > 1.05
    const isLow = valor < 0.95
    const isNeutral = !isHigh && !isLow

    return (
      <span className={`inline-flex items-center gap-1 font-mono text-sm ml-2 ${
        isHigh ? 'text-green-500' : isLow ? 'text-red-500' : 'text-yellow-500'
      }`}>
        {valor.toFixed(2)}
        {isHigh && <TrendingUp className="w-3.5 h-3.5" />}
        {isLow && <TrendingDown className="w-3.5 h-3.5" />}
        {isNeutral && <Minus className="w-3.5 h-3.5" />}
      </span>
    )
  }

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm mt-4">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Médias e Forças do Confronto
        </CardTitle>
      </CardHeader>
      
      {/* TAREFA 1: Médias da Liga na faixa global */}
      <div className="bg-muted/20 border-b px-4 py-3 text-sm text-muted-foreground flex flex-col justify-center items-center gap-2 text-center">
        {/* Linha de Gols */}
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
          <span className="font-bold uppercase text-[11px] tracking-widest text-muted-foreground/70 min-w-[140px] md:text-right">── Média Liga GOLS</span>
          <span>Mandante: <span className="font-mono text-foreground font-semibold">{medias.liga.muH.toFixed(2)}</span> <span className="text-[0.9em] text-muted-foreground/60">(Var: {medias.liga.varH.toFixed(2)})</span></span>
          <span className="hidden md:inline text-border">|</span>
          <span>Visitante: <span className="font-mono text-foreground font-semibold">{medias.liga.muA.toFixed(2)}</span> <span className="text-[0.9em] text-muted-foreground/60">(Var: {medias.liga.varA.toFixed(2)})</span></span>
        </div>
        
        {/* Linha de xG */}
        {xgDisponivel && ligaMediasXG && (
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span className="font-bold uppercase text-[11px] tracking-widest text-muted-foreground/70 min-w-[140px] md:text-right">── Média Liga xG</span>
            <span>Mandante: <span className="font-mono text-foreground font-semibold">{ligaMediasXG.muH.toFixed(2)}</span> <span className="text-[0.9em] text-muted-foreground/60">(Var: {ligaMediasXG.varH.toFixed(2)})</span></span>
            <span className="hidden md:inline text-border">|</span>
            <span>Visitante: <span className="font-mono text-foreground font-semibold">{ligaMediasXG.muA.toFixed(2)}</span> <span className="text-[0.9em] text-muted-foreground/60">(Var: {ligaMediasXG.varA.toFixed(2)})</span></span>
          </div>
        )}
      </div>

      <CardContent className="flex-1 p-4 md:p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* ========================================================= */}
          {/* CARD MANDANTE */}
          {/* ========================================================= */}
          <Card className="border-l-4 border-l-primary overflow-hidden shadow-none">
            <div className="bg-muted/30 px-4 py-2 border-b">
              <h4 className="font-bold text-sm tracking-wide">MANDANTE ({homeTeamName})</h4>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              
              {/* TAREFA 2: GOLS */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── Gols</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gols marcados (casa):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base">{medias.home.mgc.toFixed(2)}</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCAtC: {renderForca(forcas.home.fcAtC)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gols sofridos (casa):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base">{medias.home.mgsc.toFixed(2)}</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCDfC: {renderForca(forcas.home.fcDfC)}</span>
                    </div>
                  </div>
                </div>

                {/* Lambda Simples (Mandante) */}
                <div className="border-t border-dashed mt-4 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── λ SIMPLES</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Projeção (Média):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-primary">
                          {((medias.home.mgc + medias.away.mgsv) / 2).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-muted-foreground text-xs min-w-[90px] text-right font-mono">
                          ({medias.home.mgc.toFixed(2)} + {medias.away.mgsv.toFixed(2)}) / 2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TAREFA 3: EXPECTED GOALS (xG) */}
              <div>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── EXPECTED GOALS (xG)</span>
                </div>
                
                {xgDisponivel && mediasHomeXG && forcasHomeXG ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">xG criado (casa):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base">{mediasHomeXG.xgFC.toFixed(2)}</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCAtC_xG: {renderForca(forcasHomeXG.fcAtC)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">xG concedido (casa):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base">{mediasHomeXG.xgSC.toFixed(2)}</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCDfC_xG: {renderForca(forcasHomeXG.fcDfC)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic mt-1">
                    xG indisponível para esta liga.
                  </div>
                )}
              </div>

              {/* Confiança */}
              <div>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── Confiança (medidas de dispersão)</span>
                </div>
                
                <div className="flex items-center justify-between text-sm flex-wrap gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px] font-bold uppercase">Gols</span>
                    <span className="text-muted-foreground text-xs ml-1">DP: <span className="text-foreground font-mono">{medias.home.dispersaoCasa.dp.toFixed(2)}</span></span>
                    <span className="text-muted-foreground text-xs ml-1">CV: <span className="text-foreground font-mono">{medias.home.dispersaoCasa.cv.toFixed(2)}</span></span>
                    <div className="ml-1 scale-90 origin-left"><BadgeConfianca nivel={medias.home.dispersaoCasa.nivel} /></div>
                  </div>

                  {xgDisponivel && mediasHomeXG && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px] font-bold uppercase">xG</span>
                      <span className="text-muted-foreground text-xs ml-1">DP: <span className="text-foreground font-mono">{mediasHomeXG.dispersaoCasa.dp.toFixed(2)}</span></span>
                      <span className="text-muted-foreground text-xs ml-1">CV: <span className="text-foreground font-mono">{mediasHomeXG.dispersaoCasa.cv.toFixed(2)}</span></span>
                      <div className="ml-1 scale-90 origin-right"><BadgeConfianca nivel={mediasHomeXG.dispersaoCasa.nivel} /></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Frequências */}
              <div>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── Frequências</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between">
                  {[
                    { label: 'O 0.5', value: medias.home.freqCasa.over05 },
                    { label: 'O 1.5', value: medias.home.freqCasa.over15 },
                    { label: 'O 2.5', value: medias.home.freqCasa.over25 },
                    { label: 'O 3.5', value: medias.home.freqCasa.over35 },
                    { label: 'BTTS', value: medias.home.freqCasa.btts },
                    { label: 'Gol.C', value: medias.home.freqCasa.goleadaCasa },
                    { label: 'Gol.V', value: medias.home.freqCasa.goleadaVisit },
                  ].map(item => (
                    <div key={item.label} className="text-center flex-1 min-w-[32px]">
                      <div className="text-[11px] text-muted-foreground">{item.label}</div>
                      <div className={cn(
                        "text-xs font-mono font-medium mt-0.5",
                        item.value >= 0.5 ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {(item.value * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-muted/20 px-4 py-2.5 border-t text-sm text-center font-bold text-foreground flex items-center justify-center gap-2">
              <span>{medias.home.jogosCasa} jogos em casa</span>
              {medias.home.formaCasa && medias.home.formaCasa.length > 0 && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="font-normal text-muted-foreground flex items-center gap-1">
                    Forma Casa:
                    {medias.home.formaCasa.map((resultado, i) => (
                      <React.Fragment key={i}>
                        <span className={cn(
                          "font-bold",
                          resultado === 'V' ? "text-green-500" : resultado === 'E' ? "text-yellow-500" : "text-red-500"
                        )}>{resultado}</span>
                        {i < medias.home.formaCasa!.length - 1 && <span className="text-muted-foreground/50">-</span>}
                      </React.Fragment>
                    ))}
                  </span>
                </>
              )}
            </div>
          </Card>

          {/* ========================================================= */}
          {/* CARD VISITANTE */}
          {/* ========================================================= */}
          <Card className="border-l-4 border-l-blue-500 overflow-hidden shadow-none">
            <div className="bg-muted/30 px-4 py-2 border-b">
              <h4 className="font-bold text-sm tracking-wide">VISITANTE ({awayTeamName})</h4>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              
              {/* TAREFA 2: GOLS */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── Gols</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gols marcados (fora):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base">{medias.away.mgv.toFixed(2)}</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCAtV: {renderForca(forcas.away.fcAtV)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gols sofridos (fora):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base">{medias.away.mgsv.toFixed(2)}</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCDfV: {renderForca(forcas.away.fcDfV)}</span>
                    </div>
                  </div>
                </div>

                {/* Lambda Simples (Visitante) */}
                <div className="border-t border-dashed mt-4 pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── λ SIMPLES</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Projeção (Média):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-blue-500">
                          {((medias.away.mgv + medias.home.mgsc) / 2).toFixed(2)}
                        </span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-muted-foreground text-xs min-w-[90px] text-right font-mono">
                          ({medias.away.mgv.toFixed(2)} + {medias.home.mgsc.toFixed(2)}) / 2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TAREFA 3: EXPECTED GOALS (xG) */}
              <div>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── EXPECTED GOALS (xG)</span>
                </div>
                
                {xgDisponivel && mediasAwayXG && forcasAwayXG ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">xG criado (fora):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base">{mediasAwayXG.xgFV.toFixed(2)}</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCAtV_xG: {renderForca(forcasAwayXG.fcAtV)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">xG concedido (fora):</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base">{mediasAwayXG.xgSV.toFixed(2)}</span>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="text-muted-foreground text-xs min-w-[90px] text-right">FCDfV_xG: {renderForca(forcasAwayXG.fcDfV)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic mt-1">
                    xG indisponível para esta liga.
                  </div>
                )}
              </div>

              {/* Confiança */}
              <div>
                <div className="flex items-center gap-2 mb-2 mt-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── Confiança (medidas de dispersão)</span>
                </div>
                
                <div className="flex items-center justify-between text-sm flex-wrap gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px] font-bold uppercase">Gols</span>
                    <span className="text-muted-foreground text-xs ml-1">DP: <span className="text-foreground font-mono">{medias.away.dispersaoFora.dp.toFixed(2)}</span></span>
                    <span className="text-muted-foreground text-xs ml-1">CV: <span className="text-foreground font-mono">{medias.away.dispersaoFora.cv.toFixed(2)}</span></span>
                    <div className="ml-1 scale-90 origin-left"><BadgeConfianca nivel={medias.away.dispersaoFora.nivel} /></div>
                  </div>

                  {xgDisponivel && mediasAwayXG && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[11px] font-bold uppercase">xG</span>
                      <span className="text-muted-foreground text-xs ml-1">DP: <span className="text-foreground font-mono">{mediasAwayXG.dispersaoFora.dp.toFixed(2)}</span></span>
                      <span className="text-muted-foreground text-xs ml-1">CV: <span className="text-foreground font-mono">{mediasAwayXG.dispersaoFora.cv.toFixed(2)}</span></span>
                      <div className="ml-1 scale-90 origin-right"><BadgeConfianca nivel={mediasAwayXG.dispersaoFora.nivel} /></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Frequências */}
              <div>
                <div className="flex items-center gap-2 mb-2 mt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">── Frequências</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-between">
                  {[
                    { label: 'O 0.5', value: medias.away.freqFora.over05 },
                    { label: 'O 1.5', value: medias.away.freqFora.over15 },
                    { label: 'O 2.5', value: medias.away.freqFora.over25 },
                    { label: 'O 3.5', value: medias.away.freqFora.over35 },
                    { label: 'BTTS', value: medias.away.freqFora.btts },
                    { label: 'Gol.C', value: medias.away.freqFora.goleadaCasa },
                    { label: 'Gol.V', value: medias.away.freqFora.goleadaVisit },
                  ].map(item => (
                    <div key={item.label} className="text-center flex-1 min-w-[32px]">
                      <div className="text-[11px] text-muted-foreground">{item.label}</div>
                      <div className={cn(
                        "text-xs font-mono font-medium mt-0.5",
                        item.value >= 0.5 ? "text-green-500" : "text-muted-foreground"
                      )}>
                        {(item.value * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-muted/20 px-4 py-2.5 border-t text-sm text-center font-bold text-foreground flex items-center justify-center gap-2">
              <span>{medias.away.jogosFora} jogos fora</span>
              {medias.away.formaFora && medias.away.formaFora.length > 0 && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="font-normal text-muted-foreground flex items-center gap-1">
                    Forma Fora:
                    {medias.away.formaFora.map((resultado, i) => (
                      <React.Fragment key={i}>
                        <span className={cn(
                          "font-bold",
                          resultado === 'V' ? "text-green-500" : resultado === 'E' ? "text-yellow-500" : "text-red-500"
                        )}>{resultado}</span>
                        {i < medias.away.formaFora!.length - 1 && <span className="text-muted-foreground/50">-</span>}
                      </React.Fragment>
                    ))}
                  </span>
                </>
              )}
            </div>
          </Card>
          
        </div>
      </CardContent>
    </Card>
  )
}
