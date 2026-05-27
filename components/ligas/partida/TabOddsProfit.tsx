import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamMatchStats, ProfitSummary } from '@/types/estatisticas'
import { StatDisplay } from './StatDisplay'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabOddsProfitProps {
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
}

function ProfitDisplay({ strategy, profit }: { strategy: string, profit: ProfitSummary }) {
  const isPositive = profit.profit > 0
  const isNegative = profit.profit < 0

  return (
    <div className="flex flex-col p-4 border rounded-md bg-muted/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold">{strategy}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="text-xs max-w-[200px]">
              <p className="mb-1"><strong>Profit:</strong> lucro ou prejuízo acumulado apostando 1 unidade por jogo.</p>
              <p><strong>ROI:</strong> retorno percentual sobre o total apostado.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div className="text-muted-foreground">Profit:</div>
        <div className={cn("font-mono font-bold text-right", isPositive ? "text-green-500" : isNegative ? "text-red-500" : "")}>
          {profit.profit > 0 ? '+' : ''}{profit.profit.toFixed(2)}u
        </div>
        
        <div className="text-muted-foreground">ROI:</div>
        <div className={cn("font-mono font-medium text-right", profit.roi > 0 ? "text-green-500" : profit.roi < 0 ? "text-red-500" : "")}>
          {profit.roi > 0 ? '+' : ''}{profit.roi.toFixed(1)}%
        </div>
        
        <div className="text-muted-foreground">Acerto:</div>
        <div className="font-mono text-right">{profit.hitRate.toFixed(1)}%</div>
        
        <div className="text-muted-foreground">Odd média:</div>
        <div className="font-mono text-right">{profit.averageOdd?.toFixed(2) ?? '-'}</div>
        
        <div className="text-muted-foreground text-xs mt-1">Apostas:</div>
        <div className="text-xs text-right mt-1 text-muted-foreground">{profit.bets} jogos</div>
      </div>
    </div>
  )
}
function combineProfit(homeProfit: ProfitSummary, awayProfit: ProfitSummary): ProfitSummary {
  const bets = homeProfit.bets + awayProfit.bets
  const profitVal = homeProfit.profit + awayProfit.profit
  const wins = homeProfit.wins + awayProfit.wins
  const hitRate = bets > 0 ? (wins / bets) * 100 : 0
  const roi = bets > 0 ? (profitVal / bets) * 100 : 0
  
  const homeTotalOdd = (homeProfit.averageOdd ?? 0) * homeProfit.bets
  const awayTotalOdd = (awayProfit.averageOdd ?? 0) * awayProfit.bets
  const averageOdd = bets > 0 ? (homeTotalOdd + awayTotalOdd) / bets : null

  return {
    profit: profitVal,
    roi,
    bets,
    wins,
    hitRate,
    averageOdd
  }
}

export function TabOddsProfit({ homeStats, awayStats }: TabOddsProfitProps) {
  if (homeStats.sampleSize === 0 && awayStats.sampleSize === 0) {
    return <div className="text-center p-8 text-muted-foreground">Dados indisponíveis para esta métrica.</div>
  }

  // Combinar resultados das duas equipes para os mercados compatíveis
  const combinedDraw = combineProfit(homeStats.profit.draw, awayStats.profit.draw)
  const combinedOver25 = combineProfit(homeStats.profit.over25, awayStats.profit.over25)
  const combinedUnder25 = combineProfit(homeStats.profit.under25, awayStats.profit.under25)
  const combinedBttsYes = combineProfit(homeStats.profit.bttsYes, awayStats.profit.bttsYes)
  const combinedBttsNo = combineProfit(homeStats.profit.bttsNo, awayStats.profit.bttsNo)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MANDANTE */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-primary shadow-none">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <CardTitle className="text-sm font-bold tracking-wide uppercase">Mandante ({homeStats.teamName}) - Odds Médias</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Mercado 1x2</h4>
                <div className="space-y-1">
                  <StatDisplay stat={homeStats.odds.home} label="Odd Média Casa" />
                  <StatDisplay stat={homeStats.odds.draw} label="Odd Média Empate" />
                  <StatDisplay stat={homeStats.odds.away} label="Odd Média Visitante" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Over/Under 2.5</h4>
                <div className="space-y-1">
                  <StatDisplay stat={homeStats.odds.over25} label="Odd Média Over 2.5" />
                  <StatDisplay stat={homeStats.odds.under25} label="Odd Média Under 2.5" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── BTTS</h4>
                <div className="space-y-1">
                  <StatDisplay stat={homeStats.odds.bttsYes} label="Odd Média BTTS Sim" />
                  <StatDisplay stat={homeStats.odds.bttsNo} label="Odd Média BTTS Não" />
                </div>
              </div>
              <div className="text-xs text-center text-muted-foreground pt-2">
                Amostra: {homeStats.sampleSize} jogos (Base Bet365)
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="bg-muted/10 pb-3 border-b">
              <CardTitle className="text-sm font-bold tracking-wide uppercase">Profit/Loss (1u Fixa) - {homeStats.teamName}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfitDisplay strategy={`Apostar no ${homeStats.teamName}`} profit={homeStats.profit.teamWin} />
              <ProfitDisplay strategy="Apostar no Empate" profit={homeStats.profit.draw} />
              <ProfitDisplay strategy="Apostar Over 2.5" profit={homeStats.profit.over25} />
              <ProfitDisplay strategy="Apostar Under 2.5" profit={homeStats.profit.under25} />
              <ProfitDisplay strategy="Apostar BTTS Sim" profit={homeStats.profit.bttsYes} />
              <ProfitDisplay strategy="Apostar BTTS Não" profit={homeStats.profit.bttsNo} />
            </CardContent>
          </Card>
        </div>

        {/* VISITANTE */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-blue-500 shadow-none">
            <CardHeader className="bg-muted/30 pb-3 border-b">
              <CardTitle className="text-sm font-bold tracking-wide uppercase">Visitante ({awayStats.teamName}) - Odds Médias</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Mercado 1x2</h4>
                <div className="space-y-1">
                  <StatDisplay stat={awayStats.odds.home} label="Odd Média Casa" />
                  <StatDisplay stat={awayStats.odds.draw} label="Odd Média Empate" />
                  <StatDisplay stat={awayStats.odds.away} label="Odd Média Visitante" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Over/Under 2.5</h4>
                <div className="space-y-1">
                  <StatDisplay stat={awayStats.odds.over25} label="Odd Média Over 2.5" />
                  <StatDisplay stat={awayStats.odds.under25} label="Odd Média Under 2.5" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── BTTS</h4>
                <div className="space-y-1">
                  <StatDisplay stat={awayStats.odds.bttsYes} label="Odd Média BTTS Sim" />
                  <StatDisplay stat={awayStats.odds.bttsNo} label="Odd Média BTTS Não" />
                </div>
              </div>
              <div className="text-xs text-center text-muted-foreground pt-2">
                Amostra: {awayStats.sampleSize} jogos (Base Bet365)
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="bg-muted/10 pb-3 border-b">
              <CardTitle className="text-sm font-bold tracking-wide uppercase">Profit/Loss (1u Fixa) - {awayStats.teamName}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfitDisplay strategy={`Apostar no ${awayStats.teamName}`} profit={awayStats.profit.teamWin} />
              <ProfitDisplay strategy="Apostar no Empate" profit={awayStats.profit.draw} />
              <ProfitDisplay strategy="Apostar Over 2.5" profit={awayStats.profit.over25} />
              <ProfitDisplay strategy="Apostar Under 2.5" profit={awayStats.profit.under25} />
              <ProfitDisplay strategy="Apostar BTTS Sim" profit={awayStats.profit.bttsYes} />
              <ProfitDisplay strategy="Apostar BTTS Não" profit={awayStats.profit.bttsNo} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* COMBINADO (MANDANTE + VISITANTE) */}
      <Card className="shadow-none border-l-4 border-l-purple-500">
        <CardHeader className="bg-muted/10 pb-3 border-b">
          <CardTitle className="text-sm font-bold tracking-wide uppercase">
            Profit/Loss Combinado ({homeStats.teamName} [Casa] + {awayStats.teamName} [Fora])
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ProfitDisplay strategy="Apostar no Empate" profit={combinedDraw} />
          <ProfitDisplay strategy="Apostar Over 2.5" profit={combinedOver25} />
          <ProfitDisplay strategy="Apostar Under 2.5" profit={combinedUnder25} />
          <ProfitDisplay strategy="Apostar BTTS Sim" profit={combinedBttsYes} />
          <ProfitDisplay strategy="Apostar BTTS Não" profit={combinedBttsNo} />
        </CardContent>
      </Card>
    </div>
  )
}
