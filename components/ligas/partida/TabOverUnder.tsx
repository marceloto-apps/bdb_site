import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamMatchStats, OverUnderSummary, BttsSummary } from '@/types/estatisticas'

interface TabOverUnderProps {
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
}

function OverUnderTable({ title, homeData, awayData }: { title: string, homeData: OverUnderSummary[], awayData: OverUnderSummary[] }) {
  if (!homeData || homeData.length === 0 || homeData.every(d => d.total === 0)) {
    return (
      <Card className="shadow-none">
        <CardHeader className="bg-muted/10 pb-3 border-b">
          <CardTitle className="text-sm font-bold uppercase">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Dados indisponíveis
        </CardContent>
      </Card>
    )
  }

  const calcFairOdd = (percent: number) => {
    if (percent === 0) return '-'
    if (percent === 100) return '1.01' // Convention for "sure" odds
    return (100 / percent).toFixed(2)
  }

  return (
    <Card className="shadow-none overflow-hidden">
      <CardHeader className="bg-muted/10 pb-3 border-b">
        <CardTitle className="text-sm font-bold uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="py-2 px-2 text-left font-semibold text-muted-foreground">Linha</th>
                <th className="py-2 px-2 text-center font-semibold text-primary leading-tight">Mandante<br/>(Over)</th>
                <th className="py-2 px-2 text-center font-semibold text-primary leading-tight">Mandante<br/>(Under)</th>
                <th className="py-2 px-2 text-center font-semibold text-blue-500 leading-tight">Visitante<br/>(Over)</th>
                <th className="py-2 px-2 text-center font-semibold text-blue-500 leading-tight">Visitante<br/>(Under)</th>
                <th className="py-2 px-2 text-center font-semibold text-emerald-500 leading-tight">Total<br/>(Over)</th>
                <th className="py-2 px-2 text-center font-semibold text-emerald-500 leading-tight">Total<br/>(Under)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {homeData.map((homeRow, index) => {
                const awayRow = awayData[index]
                if (!awayRow) return null
                
                const totalOverCount = homeRow.overCount + awayRow.overCount
                const totalUnderCount = homeRow.underCount + awayRow.underCount
                const totalSamples = homeRow.total + awayRow.total
                const totalOverPercent = totalSamples > 0 ? (totalOverCount / totalSamples) * 100 : 0
                const totalUnderPercent = totalSamples > 0 ? (totalUnderCount / totalSamples) * 100 : 0
                
                return (
                  <tr key={homeRow.line} className="hover:bg-muted/10 transition-colors">
                    <td className="py-2 px-2 font-mono font-bold text-sm">{homeRow.line.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">{homeRow.overPercent.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(homeRow.overPercent)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">{homeRow.underPercent.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(homeRow.underPercent)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">{awayRow.overPercent.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(awayRow.overPercent)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm">{awayRow.underPercent.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(awayRow.underPercent)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center bg-emerald-500/5">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm text-emerald-500">{totalOverPercent.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(totalOverPercent)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center bg-emerald-500/5">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-sm text-emerald-500">{totalUnderPercent.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(totalUnderPercent)}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function BttsTable({ homeData, awayData }: { homeData: BttsSummary, awayData: BttsSummary }) {
  if (!homeData || homeData.total === 0) {
    return (
      <Card className="shadow-none">
        <CardHeader className="bg-muted/10 pb-3 border-b">
          <CardTitle className="text-sm font-bold uppercase">Ambas Marcam (BTTS)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          Dados indisponíveis
        </CardContent>
      </Card>
    )
  }

  const calcFairOdd = (percent: number) => {
    if (percent === 0) return '-'
    if (percent === 100) return '1.01'
    return (100 / percent).toFixed(2)
  }

  const totalYesCount = homeData.yesCount + awayData.yesCount
  const totalNoCount = homeData.noCount + awayData.noCount
  const totalSamples = homeData.total + awayData.total
  const totalYesPercent = totalSamples > 0 ? (totalYesCount / totalSamples) * 100 : 0
  const totalNoPercent = totalSamples > 0 ? (totalNoCount / totalSamples) * 100 : 0

  return (
    <Card className="shadow-none overflow-hidden">
      <CardHeader className="bg-muted/10 pb-3 border-b">
        <CardTitle className="text-sm font-bold uppercase">Ambas Marcam (BTTS)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="py-2 px-2 text-left font-semibold text-muted-foreground">Seleção</th>
                <th className="py-2 px-2 text-center font-semibold text-primary leading-tight">Mandante<br/>(%)</th>
                <th className="py-2 px-2 text-center font-semibold text-primary leading-tight">Mandante<br/>(Odd)</th>
                <th className="py-2 px-2 text-center font-semibold text-blue-500 leading-tight">Visitante<br/>(%)</th>
                <th className="py-2 px-2 text-center font-semibold text-blue-500 leading-tight">Visitante<br/>(Odd)</th>
                <th className="py-2 px-2 text-center font-semibold text-emerald-500 leading-tight">Total<br/>(%)</th>
                <th className="py-2 px-2 text-center font-semibold text-emerald-500 leading-tight">Total<br/>(Odd)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="py-3 px-2 font-bold text-sm text-left">SIM</td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">{homeData.yesPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(homeData.yesPercent)}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">{awayData.yesPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(awayData.yesPercent)}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center bg-emerald-500/5">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm text-emerald-500">{totalYesPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center bg-emerald-500/5">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(totalYesPercent)}</span>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="py-3 px-2 font-bold text-sm text-left">NÃO</td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">{homeData.noPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(homeData.noPercent)}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm">{awayData.noPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(awayData.noPercent)}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center bg-emerald-500/5">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm text-emerald-500">{totalNoPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center bg-emerald-500/5">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-muted-foreground">Odd {calcFairOdd(totalNoPercent)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function TabOverUnder({ homeStats, awayStats }: TabOverUnderProps) {
  if (homeStats.sampleSize === 0 && awayStats.sampleSize === 0) {
    return <div className="text-center p-8 text-muted-foreground">Dados indisponíveis para esta métrica.</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <OverUnderTable 
          title="Gols FT" 
          homeData={homeStats.overUnder.goalsFT} 
          awayData={awayStats.overUnder.goalsFT} 
        />
        
        <OverUnderTable 
          title="Gols HT" 
          homeData={homeStats.overUnder.goalsHT} 
          awayData={awayStats.overUnder.goalsHT} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <OverUnderTable 
          title="Escanteios FT" 
          homeData={homeStats.overUnder.cornersFT} 
          awayData={awayStats.overUnder.cornersFT} 
        />
        
        <OverUnderTable 
          title="Escanteios HT" 
          homeData={homeStats.overUnder.cornersHT} 
          awayData={awayStats.overUnder.cornersHT} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <BttsTable 
          homeData={homeStats.btts} 
          awayData={awayStats.btts} 
        />
        
        <OverUnderTable 
          title="Cartões Amarelos FT" 
          homeData={homeStats.overUnder.yellowCardsFT} 
          awayData={awayStats.overUnder.yellowCardsFT} 
        />
      </div>

    </div>
  )
}
