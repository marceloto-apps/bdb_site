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
    const userId = session.user.id;

    // Busca todos os palpites do usuário logado neste bolão
    const palpites = await prisma.bolaoPalpite.findMany({
      where: {
        bolaoId,
        userId,
      },
    });

    return NextResponse.json(palpites);
  } catch (error: any) {
    console.error("[GET /api/bolao/[bolaoId]/palpites] Erro:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
