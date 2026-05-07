'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Target, TrendingUp, ArrowUpDown, Scale } from 'lucide-react'
import { OddsMercado } from '@/lib/validations/odds-mercado'

interface PainelMercadosProps {
  mercados: {
    casa: { prob: number; oddJusta: number }
    empate: { prob: number; oddJusta: number }
    visitante: { prob: number; oddJusta: number }
    btts: { sim: number; nao: number }
    overUnder: Record<string, { over: number; under: number }>
    handicaps: Array<{ linha: number; casa: number; visitante: number }>
  }
  evPorMercado: Record<string, number> | null
  homeTeamName: string
  awayTeamName: string
  oddsMercado: OddsMercado | null
}

function BadgeValor({ ev }: { ev: number | null }) {
  if (ev === null) return <span className="text-muted-foreground">—</span>
  if (ev >= 5) return <Badge className="bg-primary text-primary-foreground">+EV</Badge>
  if (ev >= 0) return <Badge className="bg-amber-400 text-black border-transparent hover:bg-amber-500">Marginal</Badge>
  return <Badge variant="destructive">Sem valor</Badge>
}

const calcularEV = (prob: number, oddMercado: number | null): number | null => {
  if (!oddMercado || oddMercado < 1.01) return null
  return (prob * oddMercado - 1) * 100
}

export function PainelMercados({ mercados, homeTeamName, awayTeamName, oddsMercado }: PainelMercadosProps) {
  const formatProb = (p: number) => `${(p * 100).toFixed(2)}%`
  const formatOdd = (o: number) => o > 0 ? o.toFixed(2) : '—'
  const formatEV = (ev: number | null) => ev !== null ? `${ev > 0 ? '+' : ''}${ev.toFixed(1)}%` : '—'
  const calcJusta = (p: number) => p > 0 ? 1 / p : 0

  const renderOddMkt = (odd: number | null) => {
    return odd ? odd.toFixed(2) : <span className="text-muted-foreground">—</span>
  }

  return (
    <Card className="flex flex-col h-full bg-card shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Mercados e Valor Esperado
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 overflow-hidden flex flex-col divide-y divide-border">
        
        {/* 1X2 */}
        <div className="p-4 md:p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-bold tracking-wide">RESULTADO (1X2)</h4>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Seleção</TableHead>
                  <TableHead className="text-right">Prob</TableHead>
                  <TableHead className="text-right">Odd Justa</TableHead>
                  <TableHead className="text-right">Odd Mkt</TableHead>
                  <TableHead className="text-right">EV%</TableHead>
                  <TableHead className="text-right w-[100px]">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Casa */}
                <TableRow>
                  <TableCell className="font-medium">Casa</TableCell>
                  <TableCell className="text-right font-mono">{formatProb(mercados.casa.prob)}</TableCell>
                  <TableCell className="text-right font-mono">{formatOdd(mercados.casa.oddJusta)}</TableCell>
                  <TableCell className="text-right font-mono">{renderOddMkt(oddsMercado?.x1x2.home ?? null)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatEV(calcularEV(mercados.casa.prob, oddsMercado?.x1x2.home ?? null))}
                  </TableCell>
                  <TableCell className="text-right">
                    <BadgeValor ev={calcularEV(mercados.casa.prob, oddsMercado?.x1x2.home ?? null)} />
                  </TableCell>
                </TableRow>
                {/* Empate */}
                <TableRow>
                  <TableCell className="font-medium">Empate</TableCell>
                  <TableCell className="text-right font-mono">{formatProb(mercados.empate.prob)}</TableCell>
                  <TableCell className="text-right font-mono">{formatOdd(mercados.empate.oddJusta)}</TableCell>
                  <TableCell className="text-right font-mono">{renderOddMkt(oddsMercado?.x1x2.draw ?? null)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatEV(calcularEV(mercados.empate.prob, oddsMercado?.x1x2.draw ?? null))}
                  </TableCell>
                  <TableCell className="text-right">
                    <BadgeValor ev={calcularEV(mercados.empate.prob, oddsMercado?.x1x2.draw ?? null)} />
                  </TableCell>
                </TableRow>
                {/* Visitante */}
                <TableRow>
                  <TableCell className="font-medium">Visitante</TableCell>
                  <TableCell className="text-right font-mono">{formatProb(mercados.visitante.prob)}</TableCell>
                  <TableCell className="text-right font-mono">{formatOdd(mercados.visitante.oddJusta)}</TableCell>
                  <TableCell className="text-right font-mono">{renderOddMkt(oddsMercado?.x1x2.away ?? null)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatEV(calcularEV(mercados.visitante.prob, oddsMercado?.x1x2.away ?? null))}
                  </TableCell>
                  <TableCell className="text-right">
                    <BadgeValor ev={calcularEV(mercados.visitante.prob, oddsMercado?.x1x2.away ?? null)} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* BTTS */}
        <div className="p-4 md:p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-bold tracking-wide">AMBAS MARCAM (BTTS)</h4>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Seleção</TableHead>
                  <TableHead className="text-right">Prob</TableHead>
                  <TableHead className="text-right">Odd Justa</TableHead>
                  <TableHead className="text-right">Odd Mkt</TableHead>
                  <TableHead className="text-right">EV%</TableHead>
                  <TableHead className="text-right w-[100px]">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Sim */}
                <TableRow>
                  <TableCell className="font-medium">Sim</TableCell>
                  <TableCell className="text-right font-mono">{formatProb(mercados.btts.sim)}</TableCell>
                  <TableCell className="text-right font-mono">{formatOdd(calcJusta(mercados.btts.sim))}</TableCell>
                  <TableCell className="text-right font-mono">{renderOddMkt(oddsMercado?.btts.yes ?? null)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatEV(calcularEV(mercados.btts.sim, oddsMercado?.btts.yes ?? null))}
                  </TableCell>
                  <TableCell className="text-right">
                    <BadgeValor ev={calcularEV(mercados.btts.sim, oddsMercado?.btts.yes ?? null)} />
                  </TableCell>
                </TableRow>
                {/* Não */}
                <TableRow>
                  <TableCell className="font-medium">Não</TableCell>
                  <TableCell className="text-right font-mono">{formatProb(mercados.btts.nao)}</TableCell>
                  <TableCell className="text-right font-mono">{formatOdd(calcJusta(mercados.btts.nao))}</TableCell>
                  <TableCell className="text-right font-mono">{renderOddMkt(oddsMercado?.btts.no ?? null)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatEV(calcularEV(mercados.btts.nao, oddsMercado?.btts.no ?? null))}
                  </TableCell>
                  <TableCell className="text-right">
                    <BadgeValor ev={calcularEV(mercados.btts.nao, oddsMercado?.btts.no ?? null)} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Over/Under */}
        <div className="p-4 md:p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-bold tracking-wide">OVER / UNDER</h4>
          </div>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60px]">Linha</TableHead>
                  <TableHead className="text-right">O. Prob</TableHead>
                  <TableHead className="text-right">O. Justa</TableHead>
                  <TableHead className="text-right">O. Mkt</TableHead>
                  <TableHead className="text-right">O. EV%</TableHead>
                  <TableHead className="text-right border-l">U. Prob</TableHead>
                  <TableHead className="text-right">U. Justa</TableHead>
                  <TableHead className="text-right">U. Mkt</TableHead>
                  <TableHead className="text-right">U. EV%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(mercados.overUnder).map(([linha, vals]) => {
                  const isHighlight = linha === '2.5'
                  const evOver = calcularEV(vals.over, oddsMercado?.overUnder[linha]?.over ?? null)
                  const evUnder = calcularEV(vals.under, oddsMercado?.overUnder[linha]?.under ?? null)

                  return (
                    <TableRow key={linha} className={isHighlight ? 'bg-primary/5 border-l-2 border-l-primary' : ''}>
                      <TableCell className="font-bold border-r bg-muted/20 text-center">{linha}</TableCell>
                      <TableCell className="text-right font-mono">{formatProb(vals.over)}</TableCell>
                      <TableCell className="text-right font-mono">{formatOdd(calcJusta(vals.over))}</TableCell>
                      <TableCell className="text-right font-mono">{renderOddMkt(oddsMercado?.overUnder[linha]?.over ?? null)}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{formatEV(evOver)} {evOver && evOver >= 5 && <span className="text-green-500 text-[10px]">🟢</span>}</TableCell>
                      
                      <TableCell className="text-right font-mono border-l">{formatProb(vals.under)}</TableCell>
                      <TableCell className="text-right font-mono">{formatOdd(calcJusta(vals.under))}</TableCell>
                      <TableCell className="text-right font-mono">{renderOddMkt(oddsMercado?.overUnder[linha]?.under ?? null)}</TableCell>
                      <TableCell className="text-right font-mono font-bold">{formatEV(evUnder)} {evUnder && evUnder >= 5 && <span className="text-green-500 text-[10px]">🟢</span>}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Handicap Asiático */}
        {mercados.handicaps && mercados.handicaps.length > 0 && (
          <div className="p-4 md:p-6 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-bold tracking-wide">HANDICAP ASIÁTICO</h4>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[80px] text-center">Linha</TableHead>
                    <TableHead className="text-center">Casa</TableHead>
                    <TableHead className="text-center">Visitante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mercados.handicaps.map((h) => {
                    const isZero = h.linha === 0
                    return (
                      <TableRow key={h.linha} className={isZero ? 'bg-muted/30' : ''}>
                        <TableCell className="font-bold border-r bg-muted/20 text-center">
                          {h.linha > 0 ? `+${h.linha}` : h.linha}
                        </TableCell>
                        <TableCell className="text-center font-mono">{formatProb(h.casa)}</TableCell>
                        <TableCell className="text-center font-mono">{formatProb(h.visitante)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
