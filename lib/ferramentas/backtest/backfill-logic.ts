// lib/ferramentas/backtest/backfill-logic.ts

export interface MatchData {
  id: string;
  seasonId: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  status: string;
  utcDate: Date;
  fthg: number | null;
  ftag: number | null;
  stats?: {
    homeCorners: number | null;
    awayCorners: number | null;
    homeShots: number | null;
    awayShots: number | null;
    homeShotsOnTarget: number | null;
    awayShotsOnTarget: number | null;
    homeXg: number | null;
    awayXg: number | null;
    homePassesTotal: number | null;
    homePassesAccurate: number | null;
    awayPassesTotal: number | null;
    awayPassesAccurate: number | null;
  } | null;
}

// Função auxiliar para calcular desvio padrão e coeficiente de variação
export function calcularCV(valores: number[]): number {
  if (valores.length === 0) return 0;
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  if (media === 0) return 0;
  const variancia = valores.reduce((s, v) => s + Math.pow(v - media, 2), 0) / valores.length;
  const dp = Math.sqrt(variancia);
  return dp / media;
}

/**
 * Filtra as partidas passadas válidas para uma partida de referência, garantindo:
 * 1. Isolamento de temporada (m.seasonId === partidaReferencia.seasonId)
 * 2. Exclusão de dados futuros (m.utcDate < partidaReferencia.utcDate)
 * 3. Exclusão do próprio jogo (m.id !== partidaReferencia.id)
 * 4. Apenas jogos finalizados (m.status === 'FINISHED')
 */
export function obterPartidasPassadasValidas(
  partidaReferencia: { id: string; utcDate: Date; seasonId: string },
  todasAsPartidas: MatchData[]
): MatchData[] {
  return todasAsPartidas.filter(
    (m) =>
      m.seasonId === partidaReferencia.seasonId &&
      m.status === "FINISHED" &&
      m.id !== partidaReferencia.id &&
      m.utcDate.getTime() < partidaReferencia.utcDate.getTime()
  );
}

/**
 * Calcula as estatísticas de time pré-jogo para uma determinada janela
 */
export function calcularStatsParaTime(
  teamId: string,
  pastMatchesInSeason: MatchData[],
  windowSize: number | null
): {
  avgGoalsScored: number;
  avgGoalsConceded: number;
  cvGoals: number;
  avgCorners: number | null;
  avgShots: number | null;
  avgShotsOnTarget: number | null;
  xg: number | null;
  passAccuracy: number | null;
} | null {
  // Filtrar jogos passados do time (como home ou away)
  const teamPastMatches = pastMatchesInSeason.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  );

  // Selecionar os últimos N jogos do time
  const sample = windowSize
    ? teamPastMatches.slice(-windowSize)
    : teamPastMatches;

  // Mínimo de 4 partidas para computar médias confiáveis (Phase 2.5)
  if (sample.length < 4) {
    return null;
  }

  let goalsScoredSum = 0;
  let goalsConcededSum = 0;
  const goalsScoredList: number[] = [];

  let cornersSum = 0;
  let cornersCount = 0;

  let shotsSum = 0;
  let shotsCount = 0;

  let shotsOnTargetSum = 0;
  let shotsOnTargetCount = 0;

  let xgSum = 0;
  let xgCount = 0;

  let passAccuracySum = 0;
  let passAccuracyCount = 0;

  for (const m of sample) {
    const isHome = m.homeTeamId === teamId;
    const scored = isHome ? (m.fthg ?? 0) : (m.ftag ?? 0);
    const conceded = isHome ? (m.ftag ?? 0) : (m.fthg ?? 0);

    goalsScoredSum += scored;
    goalsConcededSum += conceded;
    goalsScoredList.push(scored);

    const s = m.stats;
    if (s) {
      // Corners
      const corners = isHome ? s.homeCorners : s.awayCorners;
      if (corners != null) {
        cornersSum += corners;
        cornersCount++;
      }

      // Shots
      const shots = isHome ? s.homeShots : s.awayShots;
      if (shots != null) {
        shotsSum += shots;
        shotsCount++;
      }

      // Shots on Target
      const shotsOnTarget = isHome ? s.homeShotsOnTarget : s.awayShotsOnTarget;
      if (shotsOnTarget != null) {
        shotsOnTargetSum += shotsOnTarget;
        shotsOnTargetCount++;
      }

      // xG
      const xg = isHome ? s.homeXg : s.awayXg;
      if (xg != null) {
        xgSum += xg;
        xgCount++;
      }

      // Pass Accuracy
      const passesTotal = isHome ? s.homePassesTotal : s.awayPassesTotal;
      const passesAccurate = isHome ? s.homePassesAccurate : s.awayPassesAccurate;
      if (passesTotal && passesAccurate != null) {
        passAccuracySum += passesAccurate / passesTotal;
        passAccuracyCount++;
      }
    }
  }

  return {
    avgGoalsScored: Number((goalsScoredSum / sample.length).toFixed(4)),
    avgGoalsConceded: Number((goalsConcededSum / sample.length).toFixed(4)),
    cvGoals: Number(calcularCV(goalsScoredList).toFixed(4)),
    avgCorners: cornersCount > 0 ? Number((cornersSum / cornersCount).toFixed(4)) : null,
    avgShots: shotsCount > 0 ? Number((shotsSum / shotsCount).toFixed(4)) : null,
    avgShotsOnTarget: shotsOnTargetCount > 0 ? Number((shotsOnTargetSum / shotsOnTargetCount).toFixed(4)) : null,
    xg: xgCount > 0 ? Number((xgSum / xgCount).toFixed(4)) : null,
    passAccuracy: passAccuracyCount > 0 ? Number((passAccuracySum / passAccuracyCount).toFixed(4)) : null,
  };
}
