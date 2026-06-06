'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Map, CheckCircle, XCircle } from 'lucide-react'
import { MapaValorResponse, MapaValorFaixa } from '@/types/liga'

interface PainelMapaValorProps {
  mapaValor: MapaValorResponse
}

export function PainelMapaValor({ mapaValor }: PainelMapaValorProps) {
  const [activeMarket, setActiveMarket] = useState<'1x2' | 'btts' | 'ou25'>('1x2')
  const [activeSelection, setActiveSelection] = useState<string>('casa')

  const handleMarketChange = (market: '1x2' | 'btts' | 'ou25') => {
    setActiveMarket(market)
    if (market === '1x2') {
      setActiveSelection('casa')
    } else if (market === 'btts') {
      setActiveSelection('bttsSim')
    } else if (market === 'ou25') {
      setActiveSelection('over25')
    }
  }

  const renderTabela = (dados: MapaValorFaixa[] = []) => {
    let totalApostasGeral = 0
    let totalAcertosGeral = 0
    let totalLucroGeral = 0

    dados.forEach(d => {
      totalApostasGeral += d.totalApostas
      totalAcertosGeral += d.acertos
      totalLucroGeral += d.lucroPerda
    })

    const roiGeral = totalApostasGeral > 0 ? (totalLucroGeral / totalApostasGeral) * 100 : 0

    return (
      <div className="border rounded-md overflow-hidden overflow-x-auto bg-slate-900/20 border-slate-800">
        <Table className="min-w-[500px]">
          <TableHeader className="bg-slate-900/40">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="w-[120px] text-slate-400">Faixa</TableHead>
              <TableHead className="text-right text-slate-400">Apostas</TableHead>
              <TableHead className="text-right text-slate-400">Acertos</TableHead>
              <TableHead className="text-right w-[120px] text-slate-400">ROI%</TableHead>
              <TableHead className="text-right text-slate-400">Lucro/Perda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.map((d) => {
              const semApostas = d.totalApostas === 0
              const roiPositivo = d.roi > 0
              const roiNegativo = d.roi < 0

              return (
                <TableRow key={d.faixa.label} className={`${semApostas ? 'opacity-40' : ''} border-slate-800/60 hover:bg-slate-800/10`}>
                  <TableCell className="font-medium font-mono text-xs text-slate-300">{d.faixa.label}</TableCell>
                  <TableCell className="text-right font-mono text-slate-300">{semApostas ? '—' : d.totalApostas}</TableCell>
                  <TableCell className="text-right font-mono text-slate-300">{semApostas ? '—' : d.acertos}</TableCell>
                  <TableCell className="text-right font-mono">
                    {semApostas ? (
                      <span className="text-slate-500">—</span>
                    ) : (
                      <div className={`flex items-center justify-end gap-1.5 ${roiPositivo ? 'text-green-500 font-bold' : roiNegativo ? 'text-red-500 font-bold' : ''}`}>
                        {d.roi > 0 ? '+' : ''}{d.roi.toFixed(1)}%
                        {roiPositivo && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                        {roiNegativo && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {semApostas ? (
                      <span className="text-slate-500">—</span>
                    ) : (
                      <span className={d.lucroPerda > 0 ? 'text-green-500' : d.lucroPerda < 0 ? 'text-red-500' : ''}>
                        {d.lucroPerda > 0 ? '+' : ''}{d.lucroPerda.toFixed(1)}u
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          {totalApostasGeral > 0 && (
            <tfoot className="bg-slate-900/30 font-bold border-t-2 border-slate-700">
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-slate-300">TOTAL</TableCell>
                <TableCell className="text-right font-mono text-slate-300">{totalApostasGeral}</TableCell>
                <TableCell className="text-right font-mono text-slate-300">{totalAcertosGeral}</TableCell>
                <TableCell className="text-right font-mono">
                  <span className={roiGeral > 0 ? 'text-green-500' : roiGeral < 0 ? 'text-red-500' : ''}>
                    {roiGeral > 0 ? '+' : ''}{roiGeral.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className={totalLucroGeral > 0 ? 'text-green-500' : totalLucroGeral < 0 ? 'text-red-500' : ''}>
                    {totalLucroGeral > 0 ? '+' : ''}{totalLucroGeral.toFixed(1)}u
                  </span>
                </TableCell>
              </TableRow>
            </tfoot>
          )}
        </Table>
      </div>
    )
  }

  const dadosAtivos = (mapaValor as any)[activeSelection] || []

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm border border-slate-800">
      <CardHeader className="pb-3 border-b border-slate-850">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-200">
          <Map className="w-5 h-5 text-primary" />
          Mapa de Valor — ROI por Faixa (Bet365)
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6 flex flex-col gap-6">
        
        {/* Filtros em linha única: Mercado à esquerda, Opções à direita */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Nível 1: Seleção de Mercado */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={activeMarket === '1x2' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleMarketChange('1x2')}
              className="text-xs"
            >
              Resultado (1x2)
            </Button>
            <Button 
              variant={activeMarket === 'btts' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleMarketChange('btts')}
              className="text-xs"
            >
              Ambas Marcam (BTTS)
            </Button>
            <Button 
              variant={activeMarket === 'ou25' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleMarketChange('ou25')}
              className="text-xs"
            >
              Over/Under 2.5
            </Button>
          </div>

          {/* Nível 2: Seleção de Opção dentro do Mercado */}
          <div className="flex flex-wrap gap-2 p-1 bg-slate-900/30 rounded-lg border border-slate-800 w-fit">
            {activeMarket === '1x2' && (
              <>
                <button
                  onClick={() => setActiveSelection('casa')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeSelection === 'casa' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Casa
                </button>
                <button
                  onClick={() => setActiveSelection('empate')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeSelection === 'empate' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Empate
                </button>
                <button
                  onClick={() => setActiveSelection('visitante')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeSelection === 'visitante' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Visitante
                </button>
              </>
            )}

            {activeMarket === 'btts' && (
              <>
                <button
                  onClick={() => setActiveSelection('bttsSim')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeSelection === 'bttsSim' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Sim (Ambos Marcam)
                </button>
                <button
                  onClick={() => setActiveSelection('bttsNao')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeSelection === 'bttsNao' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Não (Ambos Marcam)
                </button>
              </>
            )}

            {activeMarket === 'ou25' && (
              <>
                <button
                  onClick={() => setActiveSelection('over25')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeSelection === 'over25' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Over 2.5
                </button>
                <button
                  onClick={() => setActiveSelection('under25')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeSelection === 'under25' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Under 2.5
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="mt-2">
          {renderTabela(dadosAtivos)}
        </div>

      </CardContent>
    </Card>
  )
}
