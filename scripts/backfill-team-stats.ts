// scripts/backfill-team-stats.ts
// Rodar com: npx tsx scripts/backfill-team-stats.ts

import { PrismaClient, Side } from "@prisma/client";
import { calcularMediasLiga } from "../lib/analytics/medias";
import { estimarPiLiga } from "../lib/analytics/zero-inflated";
import { calcularVarianciaGols } from "../lib/analytics/negative-binomial";
import { estimarRhoEmpirico } from "../lib/analytics/dixon-coles";
import { obterPartidasPassadasValidas, calcularStatsParaTime } from "../lib/ferramentas/backtest/backfill-logic";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando processamento de backfill para MatchTeamStats e LeagueSnapshot...");

  // Buscar todas as competições e temporadas ativas
  const seasons = await prisma.season.findMany({
    include: {
      competition: true,
    },
  });

  console.log(`Lendo ${seasons.length} temporadas no total.`);

  for (const season of seasons) {
    const { competition } = season;
    console.log(`\n--------------------------------------------`);
    console.log(`📦 Processando: ${competition.name} (${season.year})`);

    // Buscar todas as partidas finalizadas dessa temporada
    const matches = await prisma.match.findMany({
      where: {
        seasonId: season.id,
        status: "FINISHED",
      },
      include: {
        stats: true,
      },
      orderBy: {
        utcDate: "asc",
      },
    });

    if (matches.length < 20) {
      console.log(`⚠️ Ignorado: Liga/Temporada com apenas ${matches.length} partidas concluídas (mínimo de 20 para modelagem).`);
      continue;
    }

    console.log(`Matches finalizados na temporada: ${matches.length}`);

    // --- 1. Calibrar Dixon-Coles Rho Global para esta Temporada ---
    let rhoSeason = 0;
    try {
      // Computar médias finais da liga para a calibração global de rho
      const mediasFinais = calcularMediasLiga(matches as any);
      rhoSeason = estimarRhoEmpirico(matches as any, mediasFinais);
      console.log(`🎯 Dixon-Coles Rho Global estimado: ${rhoSeason}`);
    } catch (e: any) {
      console.warn(`⚠️ Erro ao estimar Dixon-Coles Rho para a temporada: ${e.message}. Usando default = 0.`);
    }

    // Listas para inserção em lote
    const teamStatsData: any[] = [];
    const leagueSnapshotsData: any[] = [];

    // --- 2. Iterar sobre cada partida para computar as médias temporais ---
    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];

      // Pegar todas as partidas jogadas na mesma temporada ANTES do match.utcDate
      const pastMatches = obterPartidasPassadasValidas(match, matches as any);

      // --- A. Processar LeagueSnapshot se houver pelo menos 20 partidas passadas ---
      if (pastMatches.length >= 20) {
        try {
          const mediasLiga = calcularMediasLiga(pastMatches as any);
          const piLiga = estimarPiLiga(pastMatches as any, mediasLiga);
          const varLiga = calcularVarianciaGols(pastMatches as any, mediasLiga);

          // xG League Averages (se houver dados)
          const pastWithXg = pastMatches.filter(
            (m) => m.stats?.homeXg != null && m.stats?.awayXg != null
          );
          let muH_xg: number | null = null;
          let muA_xg: number | null = null;

          if (pastWithXg.length >= 20) {
            muH_xg = pastWithXg.reduce((s, m) => s + (m.stats?.homeXg || 0), 0) / pastWithXg.length;
            muA_xg = pastWithXg.reduce((s, m) => s + (m.stats?.awayXg || 0), 0) / pastWithXg.length;
          }

          leagueSnapshotsData.push({
            competitionId: season.competitionId,
            seasonId: season.id,
            matchId: match.id,
            utcDate: match.utcDate,
            muH: Number(mediasLiga.muH.toFixed(4)),
            muA: Number(mediasLiga.muA.toFixed(4)),
            varH: Number(varLiga.varCasa.toFixed(4)),
            varA: Number(varLiga.varFora.toFixed(4)),
            piH: Number(piLiga.piH.toFixed(4)),
            piA: Number(piLiga.piA.toFixed(4)),
            rho: rhoSeason, // Reutiliza o rho em memória calibrado globalmente
            totalJogos: pastMatches.length,
            muH_xg: muH_xg ? Number(muH_xg.toFixed(4)) : null,
            muA_xg: muA_xg ? Number(muA_xg.toFixed(4)) : null,
          });
        } catch (err: any) {
          // Ignora se não houver jogos suficientes na liga para cálculo de médias
        }
      }

      // --- B. Processar MatchTeamStats para Mandante e Visitante ---
      const windows = [5, 10, 20, 40, null]; // null representa a temporada inteira

      for (const teamSide of ["HOME", "AWAY"] as const) {
        const teamId = teamSide === "HOME" ? match.homeTeamId : match.awayTeamId;

        for (const windowSize of windows) {
          const stats = calcularStatsParaTime(teamId, pastMatches, windowSize);
          if (stats) {
            teamStatsData.push({
              matchId: match.id,
              teamId: teamId,
              side: teamSide === "HOME" ? Side.HOME : Side.AWAY,
              window: windowSize,
              ...stats,
            });
          }
        }
      }
    }

    // --- 3. Inserir os Snapshots e Estatísticas de Times no Banco de forma Idempotente ---
    if (leagueSnapshotsData.length > 0) {
      console.log(`💾 Inserindo ${leagueSnapshotsData.length} snapshots de liga...`);
      await prisma.leagueSnapshot.createMany({
        data: leagueSnapshotsData,
        skipDuplicates: true,
      });
    }

    if (teamStatsData.length > 0) {
      console.log(`💾 Inserindo ${teamStatsData.length} registros de estatísticas de time...`);
      await prisma.matchTeamStats.createMany({
        data: teamStatsData,
        skipDuplicates: true,
      });
    }

    console.log(`✅ Concluído com sucesso para a temporada.`);
  }

  console.log("\n🏁 FINALIZADO: Todo o backfill foi concluído!");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Erro fatal executando backfill:", e);
  process.exit(1);
});
