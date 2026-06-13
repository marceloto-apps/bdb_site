import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { bolaoId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const { bolaoId } = params;

    // Auto-inicialização segura para a Copa do Mundo 2026
    if (bolaoId === "copa-2026") {
      const compId = process.env.COPA_2026_COMP_ID || "comp_6107";
      const seasonId = process.env.COPA_2026_SEASON_ID || "sn_118868";

      // Transação atômica para criar a Competição, Temporada e Bolão se não existirem
      await prisma.$transaction(async (tx) => {
        // 1. Upsert da Competição
        const comp = await tx.competition.upsert({
          where: { externalId: compId },
          update: {},
          create: {
            externalId: compId,
            name: "Copa do Mundo 2026",
            country: "Mundo",
            slug: "copa-do-mundo-2026",
            type: "TOURNAMENT",
            active: true,
          },
        });

        // 2. Upsert da Temporada
        const season = await tx.season.upsert({
          where: { externalId: seasonId },
          update: {},
          create: {
            externalId: seasonId,
            competitionId: comp.id,
            year: "2026",
            isCurrent: true,
          },
        });

        // 3. Upsert do Bolão
        await tx.bolao.upsert({
          where: { id: "copa-2026" },
          update: {},
          create: {
            id: "copa-2026",
            nome: "Bolão Copa do Mundo 2026",
            competitionId: comp.id,
            seasonId: season.id,
            status: "ABERTO",
          },
        });
      });
    }

    // Busca o bolão
    const bolao = await prisma.bolao.findUnique({
      where: { id: bolaoId },
    });

    if (!bolao) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Bolão não encontrado" },
        { status: 404 }
      );
    }

    // --- AVALIAÇÃO ON-THE-FLY DE PARTIDAS FINALIZADAS PENDENTES ---
    try {
      const pendingMatches = await prisma.match.findMany({
        where: {
          status: "FINISHED",
          fthg: { not: null },
          ftag: { not: null },
          bolaoPalpites: {
            some: {
              bolaoId: bolao.id,
              avaliado: false
            }
          }
        },
        select: {
          id: true,
          fthg: true,
          ftag: true
        }
      });

      if (pendingMatches.length > 0) {
        const { avaliarPalpitesDePartida } = await import("@/lib/bolao/avaliarPalpite");
        for (const m of pendingMatches) {
          await avaliarPalpitesDePartida(m.id, m.fthg!, m.ftag!);
        }
      }
    } catch (err) {
      console.error("[GET /api/bolao/[bolaoId]] Erro na avaliação on-the-fly:", err);
    }
    // -------------------------------------------------------------

    // Busca as partidas relacionadas à temporada do bolão
    const matches = await prisma.match.findMany({
      where: {
        seasonId: bolao.seasonId,
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        utcDate: "asc",
      },
    });

    // Busca o score do usuário logado neste bolão
    const userScore = await prisma.bolaoScore.findUnique({
      where: {
        bolaoId_userId: {
          bolaoId: bolao.id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({
      bolao,
      matches,
      userScore,
    });
  } catch (error: any) {
    console.error("[GET /api/bolao/[bolaoId]] Erro:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
