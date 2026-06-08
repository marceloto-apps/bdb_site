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

  const ouReal: PalpiteOverUnder = real.home + real.away > 2.5 ? "OVER" : "UNDER";
  const acertouOverUnder = p.palpiteOverUnder === ouReal;

  let pontos = 0;
  if (acertouPlacar) pontos += 4;
  else if (acertouResultado) pontos += 2;
  if (acertouOverUnder) pontos += 1;

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

      // Apenas atualiza palpites do lote atual
      for (const p of chunk) {
        const avaliacao = avaliarPalpite(
          {
            golsMandante: p.golsMandante,
            golsVisitante: p.golsVisitante,
            palpiteOverUnder: p.palpiteOverUnder,
          },
          { home, away }
        );

        // Mitigação real de corrida: apenas atualiza se não tiver sido avaliado ainda
        // prisma.updateMany retorna a contagem de registros afetados
        const updateResult = await tx.bolaoPalpite.updateMany({
          where: {
            id: p.id,
            avaliado: false,
          },
          data: {
            pontos: avaliacao.pontos,
            acertouPlacar: avaliacao.acertouPlacar,
            acertouResultado: avaliacao.acertouResultado,
            acertouOverUnder: avaliacao.acertouOverUnder,
            avaliado: true,
          },
        });

        // Se realmente atualizou o palpite (count > 0), recalculamos para esse usuário
        if (updateResult.count > 0) {
          const pairKey = `${p.bolaoId}:${p.userId}`;
          if (!userIdsToRecalculate.includes(pairKey)) {
            userIdsToRecalculate.push(pairKey);
          }
        }
      }

      // Se nenhum palpite foi atualizado neste lote (devido a concorrência), prossegue
      if (userIdsToRecalculate.length === 0) return;

      // Recalcular scores de forma idempotente e agregada a partir da base (histórico completo)
      for (const pair of userIdsToRecalculate) {
        const [bolaoId, userId] = pair.split(":");

        // Busca o histórico completo de palpites avaliados desse usuário neste bolão
        const historicoPalpites = await tx.bolaoPalpite.findMany({
          where: {
            bolaoId,
            userId,
            avaliado: true,
          },
          select: {
            pontos: true,
            acertouPlacar: true,
            acertouResultado: true,
            acertouOverUnder: true,
          },
        });

        // Reduz em memória de forma agregada
        const scoreAgregado = historicoPalpites.reduce(
          (acc, val) => {
            acc.pontosTotal += val.pontos;
            if (val.acertouPlacar) acc.acertosPlacar++;
            if (val.acertouResultado) acc.acertosResultado++;
            if (val.acertouOverUnder) acc.acertosOverUnder++;
            return acc;
          },
          { pontosTotal: 0, acertosPlacar: 0, acertosResultado: 0, acertosOverUnder: 0 }
        );

        // Upsert do score consolidado
        await tx.bolaoScore.upsert({
          where: {
            bolaoId_userId: {
              bolaoId,
              userId,
            },
          },
          update: {
            pontosTotal: scoreAgregado.pontosTotal,
            acertosPlacar: scoreAgregado.acertosPlacar,
            acertosResultado: scoreAgregado.acertosResultado,
            acertosOverUnder: scoreAgregado.acertosOverUnder,
          },
          create: {
            bolaoId,
            userId,
            pontosTotal: scoreAgregado.pontosTotal,
            acertosPlacar: scoreAgregado.acertosPlacar,
            acertosResultado: scoreAgregado.acertosResultado,
            acertosOverUnder: scoreAgregado.acertosOverUnder,
          },
        });
      }
    });
  }
}
