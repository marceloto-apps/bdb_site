import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamMatchStats } from '@/types/estatisticas'
import { StatDisplay } from './StatDisplay'

interface TabEscanteiosCartoesProps {
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
}

export function TabEscanteiosCartoes({ homeStats, awayStats }: TabEscanteiosCartoesProps) {
  if (homeStats.sampleSize === 0 && awayStats.sampleSize === 0) {
    return <div className="text-center p-8 text-muted-foreground">Dados indisponíveis para esta métrica.</div>
  }

  const renderStatsColumn = (stats: TeamMatchStats, isHome: boolean) => (
    <div className="space-y-6">
      <Card className={`border-l-4 shadow-none ${isHome ? 'border-l-primary' : 'border-l-blue-500'}`}>
        <CardHeader className="bg-muted/30 pb-3 border-b">
          <CardTitle className="text-sm font-bold tracking-wide uppercase">
            {isHome ? 'MANDANTE' : 'VISITANTE'} ({stats.teamName})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          
          {/* ESCANTEIOS */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Escanteios</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.cornersTotalFT} label="Total Escanteios FT" />
                <StatDisplay stat={stats.cornersCardsFouls.cornersFT} label="Escanteios a Favor FT" />
                <StatDisplay stat={stats.cornersCardsFouls.cornersConcededFT} label="Escanteios Contra FT" />
                <StatDisplay stat={stats.cornersCardsFouls.cornersDiffFT} label="Saldo Escanteios FT" />
              </div>
              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.cornersTotal1H} label="Total Escanteios 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.corners1H} label="Escanteios a Favor 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.cornersConceded1H} label="Escanteios Contra 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.cornersDiff1H} label="Saldo Escanteios 1H" />
              </div>
              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.cornersTotal2H} label="Total Escanteios 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.corners2H} label="Escanteios a Favor 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.cornersConceded2H} label="Escanteios Contra 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.cornersDiff2H} label="Saldo Escanteios 2H" />
              </div>
            </div>
          </div>

          {/* CARTÕES */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Cartões</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsTotalFT} label="Total Amarelos FT" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsFT} label="Amarelos a Favor FT" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsConcededFT} label="Amarelos Contra FT" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsDiffFT} label="Saldo Amarelos FT" />
              </div>
              
              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsTotal1H} label="Total Amarelos 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCards1H} label="Amarelos a Favor 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsConceded1H} label="Amarelos Contra 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsDiff1H} label="Saldo Amarelos 1H" />
              </div>

              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsTotal2H} label="Total Amarelos 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCards2H} label="Amarelos a Favor 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsConceded2H} label="Amarelos Contra 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.yellowCardsDiff2H} label="Saldo Amarelos 2H" />
              </div>

              <div className="space-y-1 pt-2 border-t border-dashed">
                <StatDisplay stat={stats.cornersCardsFouls.redCardsTotalFT} label="Total Vermelhos FT" />
                <StatDisplay stat={stats.cornersCardsFouls.redCardsFT} label="Vermelhos a Favor FT" />
                <StatDisplay stat={stats.cornersCardsFouls.redCardsConcededFT} label="Vermelhos Contra FT" />
                <StatDisplay stat={stats.cornersCardsFouls.redCardsDiffFT} label="Saldo Vermelhos FT" />
              </div>
            </div>
          </div>

          {/* FALTAS */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Faltas</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.foulsTotalFT} label="Total Faltas FT" />
                <StatDisplay stat={stats.cornersCardsFouls.foulsFT} label="Faltas Cometidas FT" />
                <StatDisplay stat={stats.cornersCardsFouls.foulsConcededFT} label="Faltas Sofridas FT" />
                <StatDisplay stat={stats.cornersCardsFouls.foulsDiffFT} label="Saldo Faltas FT" />
              </div>

              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.foulsTotal1H} label="Total Faltas 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.fouls1H} label="Faltas Cometidas 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.foulsConceded1H} label="Faltas Sofridas 1H" />
                <StatDisplay stat={stats.cornersCardsFouls.foulsDiff1H} label="Saldo Faltas 1H" />
              </div>

              <div className="space-y-1">
                <StatDisplay stat={stats.cornersCardsFouls.foulsTotal2H} label="Total Faltas 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.fouls2H} label="Faltas Cometidas 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.foulsConceded2H} label="Faltas Sofridas 2H" />
                <StatDisplay stat={stats.cornersCardsFouls.foulsDiff2H} label="Saldo Faltas 2H" />
              </div>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-2 border-t">
            Amostra: {stats.sampleSize} jogos
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderStatsColumn(homeStats, true)}
        {renderStatsColumn(awayStats, false)}
      </div>
    </div>
  )
}
