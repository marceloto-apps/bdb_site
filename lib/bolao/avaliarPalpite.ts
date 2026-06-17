import { prisma } from "@/lib/prisma";
import { PalpiteOverUnder } from "@prisma/client";

type Resultado = "HOME" | "DRAW" | "AWAY";

function resultadoDe(home: number, away: number): Resultado {
  if (home > away) return "HOME";
  if (home < away) return "AWAY";
  return "DRAW";
}

export interface Avaliacao {
  pontos: number;
  acertouPlacar: boolean;
  acertouResultado: boolean;
  acertouOverUnder: boolean;
}

/**
 * Função pura para calcular a pontuação de um palpite individual.
 * Regras:
 * - Placar exato → 4 pts (anula o resultado)
 * - Apenas resultado (1x2) → 2 pts
 * - Over/Under 2.5 gols → +1 pt (independente)
 * Range: 0..5
 */
export function avaliarPalpite(
  p: { golsMandante: number; golsVisitante: number; palpiteOverUnder: PalpiteOverUnder },
  real: { home: number; away: number }
): Avaliacao {
  const acertouPlacar =
    p.golsMandante === real.home && p.golsVisitante === real.away;
  const acertouResultado =
    resultadoDe(p.golsMandante, p.golsVisitante) === resultadoDe(real.home, real.away);

  // Over/under desativado do processo conforme solicitação do usuário
  const acertouOverUnder = false;

  let pontos = 0;
  if (acertouPlacar) pontos += 4;
  else if (acertouResultado) pontos += 2;

  return { pontos, acertouPlacar, acertouResultado, acertouOverUnder };
}

/**
 * Avalia todos os palpites pendentes de uma partida e atualiza os rankings (BolaoScore)
 * dos usuários afetados de forma transacional e idempotente.
 *
 * Processado em lotes (chunks) de 50 registros.
 */
export async function avaliarPalpitesDePartida(
  matchId: string,
  home: number,
  away: number
): Promise<void> {
  // 1. Buscar palpites não avaliados para a partida
  const palpites = await prisma.bolaoPalpite.findMany({
    where: {
      matchId,
      avaliado: false,
    },
  });

  if (palpites.length === 0) return;

  const CHUNK_SIZE = 50;

  // Processar palpites em lotes
  for (let i = 0; i < palpites.length; i += CHUNK_SIZE) {
    const chunk = palpites.slice(i, i + CHUNK_SIZE);

    await prisma.$transaction(async (tx) => {
      const userIdsToRecalculate: string[] = [];
      const p4Ids: string[] = [];
      const p2Ids: string[] = [];
      const p0Ids: string[] = [];

      // Apenas avalia palpites do lote atual
      for (const p of chunk) {
        const avaliacao = avaliarPalpite(
          {
            golsMandante: p.golsMandante,
            golsVisitante: p.golsVisitante,
            palpiteOverUnder: p.palpiteOverUnder,
          },
          { home, away }
        );

        if (avaliacao.pontos === 4) {
          p4Ids.push(p.id);
        } else if (avaliacao.pontos === 2) {
          p2Ids.push(p.id);
        } else {
          p0Ids.push(p.id);
        }

        const pairKey = `${p.bolaoId}:${p.userId}`;
        if (!userIdsToRecalculate.includes(pairKey)) {
          userIdsToRecalculate.push(pairKey);
        }
      }

      // Executa as atualizações em lote (bulk)
      if (p4Ids.length > 0) {
        await tx.bolaoPalpite.updateMany({
          where: { id: { in: p4Ids }, avaliado: false },
          data: { pontos: 4, acertouPlacar: true, acertouResultado: true, acertouOverUnder: false, avaliado: true },
        });
      }
      if (p2Ids.length > 0) {
        await tx.bolaoPalpite.updateMany({
          where: { id: { in: p2Ids }, avaliado: false },
          data: { pontos: 2, acertouPlacar: false, acertouResultado: true, acertouOverUnder: false, avaliado: true },
        });
      }
      if (p0Ids.length > 0) {
        await tx.bolaoPalpite.updateMany({
          where: { id: { in: p0Ids }, avaliado: false },
          data: { pontos: 0, acertouPlacar: false, acertouResultado: false, acertouOverUnder: false, avaliado: true },
        });
      }

      // Se nenhum usuário foi afetado neste lote, prossegue
      if (userIdsToRecalculate.length === 0) return;

      // Monta a estrutura para buscar todo o histórico em uma única consulta
      const userPairs = userIdsToRecalculate.map((pair) => {
        const [bolaoId, userId] = pair.split(":");
        return { bolaoId, userId };
      });

      const allHistories = await tx.bolaoPalpite.findMany({
        where: {
          OR: userPairs.map((up) => ({ bolaoId: up.bolaoId, userId: up.userId, avaliado: true })),
        },
        select: {
          bolaoId: true,
          userId: true,
          pontos: true,
          acertouPlacar: true,
          acertouResultado: true,
          acertouOverUnder: true,
        },
      });

      // Agrupa em memória
      const groupedByUser: Record<string, typeof allHistories> = {};
      for (const h of allHistories) {
        const key = `${h.bolaoId}:${h.userId}`;
        if (!groupedByUser[key]) groupedByUser[key] = [];
        groupedByUser[key].push(h);
      }

      // Recalcular scores de forma idempotente
      for (const pair of userIdsToRecalculate) {
        const [bolaoId, userId] = pair.split(":");
        const key = `${bolaoId}:${userId}`;
        const historicoPalpites = groupedByUser[key] || [];

        const totalGuesses = historicoPalpites.length;
        const scoreAgregado = historicoPalpites.reduce(
          (acc, val) => {
            acc.somaPontos += val.pontos;
            if (val.acertouPlacar) acc.acertosPlacar++;
            if (val.acertouResultado && !val.acertouPlacar) acc.acertosResultado++;
            if (val.acertouOverUnder) acc.acertosOverUnder++;
            return acc;
          },
          { somaPontos: 0, acertosPlacar: 0, acertosResultado: 0, acertosOverUnder: 0 }
        );

        const pontosTotal = totalGuesses > 0 ? scoreAgregado.somaPontos / totalGuesses : 0.0;

        // Upsert do score consolidado
        await tx.bolaoScore.upsert({
          where: {
            bolaoId_userId: {
              bolaoId,
              userId,
            },
          },
          update: {
            pontosTotal,
            quantidadePalpites: totalGuesses,
            acertosPlacar: scoreAgregado.acertosPlacar,
            acertosResultado: scoreAgregado.acertosResultado,
            acertosOverUnder: scoreAgregado.acertosOverUnder,
          },
          create: {
            bolaoId,
            userId,
            pontosTotal,
            quantidadePalpites: totalGuesses,
            acertosPlacar: scoreAgregado.acertosPlacar,
            acertosResultado: scoreAgregado.acertosResultado,
            acertosOverUnder: scoreAgregado.acertosOverUnder,
          },
        });
      }
    });
  }
}
