"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface PainelProjecaoHandicapsProps {
  matrizPlacares: number[][]
}

interface HandicapRow {
  line: number
  lineLabel: string
  winProb: number
  asianProb: number
  fairOdd: number
}

function calculateFairOdd(winProb: number, halfWinProb: number, pushProb: number, halfLossProb: number, lossProb: number) {
  const winEquity = winProb + 0.5 * halfWinProb
  const lossEquity = lossProb + 0.5 * halfLossProb
  if (winEquity === 0) return 999
  return 1 + (lossEquity / winEquity)
}

function getReturn(margin: number, line: number): number {
  if (line % 0.5 !== 0) {
    // Quarter line
    const lower = line > 0 ? line - 0.25 : line + 0.25
    const upper = line > 0 ? line + 0.25 : line - 0.25
    return (getReturn(margin, lower) + getReturn(margin, upper)) / 2
  }
  
  if (margin + line > 0) return 1
  if (margin + line === 0) return 0
  return -1
}

function getOverReturn(total: number, line: number): number {
  if (line % 0.5 !== 0) {
    const lower = line - 0.25
    const upper = line + 0.25
    return (getOverReturn(total, lower) + getOverReturn(total, upper)) / 2
  }
  if (total > line) return 1
  if (total === line) return 0
  return -1
}

export function PainelProjecaoHandicaps({ matrizPlacares }: PainelProjecaoHandicapsProps) {
  
  const handicaps = useMemo(() => {
    const lines = []
    for (let i = -2.5; i <= 2.5; i += 0.25) {
      lines.push(i)
    }

    const homeData: HandicapRow[] = []
    const awayData: HandicapRow[] = []

    lines.forEach(line => {
      let hWin = 0, hHalfWin = 0, hPush = 0, hHalfLoss = 0, hLoss = 0
      let aWin = 0, aHalfWin = 0, aPush = 0, aHalfLoss = 0, aLoss = 0

      for (let h = 0; h <= 10; h++) {
        for (let a = 0; a <= 10; a++) {
          const p = matrizPlacares[h]?.[a] || 0
          if (p === 0) continue

          const margin = h - a
          
          // Home Handicap
          const hRet = getReturn(margin, line)
          if (hRet === 1) hWin += p
          else if (hRet === 0.5) hHalfWin += p
          else if (hRet === 0) hPush += p
          else if (hRet === -0.5) hHalfLoss += p
          else hLoss += p

          // Away Handicap (opposite margin, same line interpretation. A +line for away means they have an advantage)
          const aRet = getReturn(-margin, line)
          if (aRet === 1) aWin += p
          else if (aRet === 0.5) aHalfWin += p
          else if (aRet === 0) aPush += p
          else if (aRet === -0.5) aHalfLoss += p
          else aLoss += p
        }
      }

      homeData.push({
        line,
        lineLabel: line > 0 ? `+${line}` : `${line}`,
        winProb: hWin * 100,
        asianProb: (hHalfWin + hPush + hHalfLoss) * 100,
        fairOdd: calculateFairOdd(hWin, hHalfWin, hPush, hHalfLoss, hLoss)
      })

      awayData.push({
        line,
        lineLabel: line > 0 ? `+${line}` : `${line}`,
        winProb: aWin * 100,
        asianProb: (aHalfWin + aPush + aHalfLoss) * 100,
        fairOdd: calculateFairOdd(aWin, aHalfWin, aPush, aHalfLoss, aLoss)
      })
    })

    return { homeData: homeData.reverse(), awayData: awayData.reverse() }
  }, [matrizPlacares])

  const totals = useMemo(() => {
    const lines = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.5, 5.5]
    
    const overData: HandicapRow[] = []

    lines.forEach(line => {
      let win = 0, halfWin = 0, push = 0, halfLoss = 0, loss = 0

      for (let h = 0; h <= 10; h++) {
        for (let a = 0; a <= 10; a++) {
          const p = matrizPlacares[h]?.[a] || 0
          if (p === 0) continue

          const total = h + a
          const ret = getOverReturn(total, line)
          
          if (ret === 1) win += p
          else if (ret === 0.5) halfWin += p
          else if (ret === 0) push += p
          else if (ret === -0.5) halfLoss += p
          else loss += p
        }
      }

      overData.push({
        line,
        lineLabel: `+${line}`,
        winProb: win * 100,
        asianProb: (halfWin + push + halfLoss) * 100,
        fairOdd: calculateFairOdd(win, halfWin, push, halfLoss, loss)
      })
    })

    return overData
  }, [matrizPlacares])

  const renderTable = (data: HandicapRow[], colorClass: string) => (
    <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
      <table className="w-full text-xs text-center">
        <thead className="sticky top-0 bg-background/95 backdrop-blur z-10">
          <tr className="border-b border-muted">
            <th className="py-2 px-2 text-left font-semibold text-muted-foreground w-1/4">Linha</th>
            <th className="py-2 px-2 font-semibold text-muted-foreground w-1/4">Win %</th>
            <th className="py-2 px-2 font-semibold text-muted-foreground w-1/4">Push %</th>
            <th className="py-2 px-2 font-semibold text-muted-foreground w-1/4">Odd</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-muted/50">
          {data.map(row => (
            <tr key={row.line} className="hover:bg-muted/10 transition-colors">
              <td className="py-2 px-2 text-left font-mono font-bold text-sm">
                {row.lineLabel}
              </td>
              <td className="py-2 px-2">
                <span className={`font-bold ${colorClass}`}>
                  {row.winProb.toFixed(1)}%
                </span>
              </td>
              <td className="py-2 px-2 text-muted-foreground">
                {row.asianProb > 0.01 ? `${row.asianProb.toFixed(1)}%` : '-'}
              </td>
              <td className="py-2 px-2">
                <Badge variant="outline" className={`font-mono text-[11px] font-bold px-2 py-0.5 ${row.fairOdd < 3 ? colorClass : 'text-muted-foreground'}`}>
                  {row.fairOdd === 999 ? '∞' : row.fairOdd.toFixed(2)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <Card className="h-full border-muted/50 overflow-hidden shadow-none flex flex-col">
      <CardHeader className="bg-muted/10 py-3 px-4 border-b border-muted/30">
        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase">
          <span className="text-blue-500">📈</span>
          Projeção de Handicaps
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <Tabs defaultValue="home" className="w-full h-full flex flex-col">
          <div className="px-4 py-2 border-b border-muted/30">
            <TabsList className="w-full grid grid-cols-3 bg-muted/20">
              <TabsTrigger value="home" className="text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Mandante</TabsTrigger>
              <TabsTrigger value="away" className="text-xs data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-500">Visitante</TabsTrigger>
              <TabsTrigger value="over" className="text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500">Over</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 p-2">
            <TabsContent value="home" className="m-0 h-full">
              {renderTable(handicaps.homeData, "text-primary")}
            </TabsContent>
            <TabsContent value="away" className="m-0 h-full">
              {renderTable(handicaps.awayData, "text-blue-500")}
            </TabsContent>
            <TabsContent value="over" className="m-0 h-full">
              {renderTable(totals, "text-emerald-500")}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
