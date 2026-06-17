import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Validar autenticação via cabeçalho Authorization
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ADMIN_API_KEY;

    if (!expectedToken) {
      console.error("[POST /api/webhook/recalculate-bolao] ADMIN_API_KEY não está configurada no ambiente.");
      return NextResponse.json(
        { error: "INTERNAL_ERROR", message: "Configuração do servidor inválida" },
        { status: 500 }
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.substring(7) !== expectedToken) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Chave de API inválida ou ausente" },
        { status: 401 }
      );
    }

    // 2. Buscar partidas que já finalizaram e possuem palpites não avaliados
    const pendingMatches = await prisma.match.findMany({
      where: {
        status: "FINISHED",
        fthg: { not: null },
        ftag: { not: null },
        bolaoPalpites: {
          some: {
            avaliado: false,
          },
        },
      },
      select: {
        id: true,
        fthg: true,
        ftag: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    });

    const evaluated: Array<{ id: string; match: string; score: string }> = [];

    // 3. Processar avaliação das partidas pendentes
    if (pendingMatches.length > 0) {
      const { avaliarPalpitesDePartida } = await import("@/lib/bolao/avaliarPalpite");
      for (const m of pendingMatches) {
        await avaliarPalpitesDePartida(m.id, m.fthg!, m.ftag!);
        evaluated.push({
          id: m.id,
          match: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
          score: `${m.fthg}x${m.ftag}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processadas ${evaluated.length} partidas com sucesso.`,
      evaluated,
    });
  } catch (error: any) {
    console.error("[POST /api/webhook/recalculate-bolao] Erro fatal:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
