import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const palpiteSchema = z.object({
  matchId: z.string(),
  golsMandante: z.number().int().min(0, "Gols do mandante devem ser maiores ou iguais a 0"),
  golsVisitante: z.number().int().min(0, "Gols do visitante devem ser maiores ou iguais a 0"),
  palpiteOverUnder: z.enum(["OVER", "UNDER"]).optional().default("UNDER"),
});

export async function POST(
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

    // 1. Validar corpo da requisição
    const body = await req.json();
    const parsed = palpiteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { matchId, golsMandante, golsVisitante, palpiteOverUnder } = parsed.data;

    // 2. Buscar dados da partida para validação de horário
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Partida não encontrada" },
        { status: 404 }
      );
    }

    // 3. Validar se palpites estão fechados (now >= lockedAt ou partida não é SCHEDULED)
    // O lock ocorre 1 hora antes do utcDate do jogo
    const now = new Date();
    const lockedAt = new Date(match.utcDate.getTime() - 60 * 60 * 1000);

    if (now >= lockedAt || match.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Os palpites para esta partida estão encerrados." },
        { status: 403 }
      );
    }

    // 4. Salvar ou atualizar o palpite (upsert)
    const palpite = await prisma.bolaoPalpite.upsert({
      where: {
        bolaoId_userId_matchId: {
          bolaoId,
          userId,
          matchId,
        },
      },
      update: {
        golsMandante,
        golsVisitante,
        palpiteOverUnder,
        lockedAt,
      },
      create: {
        bolaoId,
        userId,
        matchId,
        golsMandante,
        golsVisitante,
        palpiteOverUnder,
        lockedAt,
      },
    });

    return NextResponse.json(palpite);
  } catch (error: any) {
    console.error("[POST /api/bolao/[bolaoId]/palpite] Erro:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
