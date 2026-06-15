import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const userId = session.user.id;

    // --- AVALIAÇÃO ON-THE-FLY DE PARTIDAS FINALIZADAS PENDENTES ---
    try {
      const pendingMatches = await prisma.match.findMany({
        where: {
          status: "FINISHED",
          fthg: { not: null },
          ftag: { not: null },
          bolaoPalpites: {
            some: {
              bolaoId,
              avaliado: false,
            },
          },
        },
        select: {
          id: true,
          fthg: true,
          ftag: true,
        },
      });

      if (pendingMatches.length > 0) {
        const { avaliarPalpitesDePartida } = await import("@/lib/bolao/avaliarPalpite");
        for (const m of pendingMatches) {
          await avaliarPalpitesDePartida(m.id, m.fthg!, m.ftag!);
        }
      }
    } catch (err) {
      console.error("[GET /api/bolao/[bolaoId]/palpites] Erro na avaliação on-the-fly:", err);
    }
    // -------------------------------------------------------------

    // Busca todos os palpites do usuário logado neste bolão
    const palpites = await prisma.bolaoPalpite.findMany({
      where: {
        bolaoId,
        userId,
      },
    });

    return NextResponse.json(palpites, {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[GET /api/bolao/[bolaoId]/palpites] Erro:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
