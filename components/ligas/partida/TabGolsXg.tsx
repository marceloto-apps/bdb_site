import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamMatchStats } from '@/types/estatisticas'
import { StatDisplay } from './StatDisplay'

interface TabGolsXgProps {
  homeStats: TeamMatchStats
  awayStats: TeamMatchStats
}

export function TabGolsXg({ homeStats, awayStats }: TabGolsXgProps) {
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
          
          {/* GOLS */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Gols</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.goalsTotalFT} label="Total Gols FT" />
                <StatDisplay stat={stats.goalsXgShots.goalsFT} label="Gols Marcados FT" />
                <StatDisplay stat={stats.goalsXgShots.goalsConcededFT} label="Gols Sofridos FT" />
                <StatDisplay stat={stats.goalsXgShots.goalsDiffFT} label="Saldo de Gols FT" />
              </div>
              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.goalsTotal1H} label="Total Gols 1H" />
                <StatDisplay stat={stats.goalsXgShots.goals1H} label="Gols Marcados 1H" />
                <StatDisplay stat={stats.goalsXgShots.goalsConceded1H} label="Gols Sofridos 1H" />
                <StatDisplay stat={stats.goalsXgShots.goalsDiff1H} label="Saldo de Gols 1H" />
              </div>
            </div>
          </div>

          {/* xG */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── xG</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.xgTotalFT} label="Total xG FT" />
                <StatDisplay stat={stats.goalsXgShots.xgFT} label="xG a Favor FT" />
                <StatDisplay stat={stats.goalsXgShots.xgConcededFT} label="xG Contra FT" />
                <StatDisplay stat={stats.goalsXgShots.xgDiffFT} label="Saldo xG FT" />
              </div>
              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.xgTotal1H} label="Total xG 1H" />
                <StatDisplay stat={stats.goalsXgShots.xg1H} label="xG a Favor 1H" />
                <StatDisplay stat={stats.goalsXgShots.xgConceded1H} label="xG Contra 1H" />
                <StatDisplay stat={stats.goalsXgShots.xgDiff1H} label="Saldo xG 1H" />
              </div>
              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.xgTotal2H} label="Total xG 2H" />
                <StatDisplay stat={stats.goalsXgShots.xg2H} label="xG a Favor 2H" />
                <StatDisplay stat={stats.goalsXgShots.xgConceded2H} label="xG Contra 2H" />
                <StatDisplay stat={stats.goalsXgShots.xgDiff2H} label="Saldo xG 2H" />
              </div>
            </div>
          </div>

          {/* FINALIZAÇÕES */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">── Finalizações</h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.shotsTotalFT} label="Total Finalizações FT" />
                <StatDisplay stat={stats.goalsXgShots.shotsFT} label="Finalizações a Favor FT" />
                <StatDisplay stat={stats.goalsXgShots.shotsConcededFT} label="Finalizações Contra FT" />
                <StatDisplay stat={stats.goalsXgShots.shotsDiffFT} label="Saldo Finalizações FT" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetTotalFT} label="Total Fin. no Alvo FT" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetFT} label="Finalizações no Alvo FT" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetConcededFT} label="Fin. Alvo Contra FT" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetDiffFT} label="Saldo Fin. Alvo FT" />
              </div>
              
              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.shotsTotal1H} label="Total Finalizações 1H" />
                <StatDisplay stat={stats.goalsXgShots.shots1H} label="Finalizações a Favor 1H" />
                <StatDisplay stat={stats.goalsXgShots.shotsConceded1H} label="Finalizações Contra 1H" />
                <StatDisplay stat={stats.goalsXgShots.shotsDiff1H} label="Saldo Finalizações 1H" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetTotal1H} label="Total Fin. no Alvo 1H" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTarget1H} label="Finalizações no Alvo 1H" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetConceded1H} label="Fin. Alvo Contra 1H" />
              </div>

              <div className="space-y-1">
                <StatDisplay stat={stats.goalsXgShots.shotsTotal2H} label="Total Finalizações 2H" />
                <StatDisplay stat={stats.goalsXgShots.shots2H} label="Finalizações a Favor 2H" />
                <StatDisplay stat={stats.goalsXgShots.shotsConceded2H} label="Finalizações Contra 2H" />
                <StatDisplay stat={stats.goalsXgShots.shotsDiff2H} label="Saldo Finalizações 2H" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetTotal2H} label="Total Fin. no Alvo 2H" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTarget2H} label="Finalizações no Alvo 2H" />
                <StatDisplay stat={stats.goalsXgShots.shotsOnTargetConceded2H} label="Fin. Alvo Contra 2H" />
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
