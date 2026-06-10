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

    // Obter parâmetros de paginação da query string
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    // Buscar ranking com a ordenação especificada e desempate por data de criação do usuário
    const [ranking, total] = await Promise.all([
      prisma.bolaoScore.findMany({
        where: { bolaoId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { pontosTotal: "desc" },
          { quantidadePalpites: "desc" }, // 1º critério de desempate
          { acertosPlacar: "desc" },      // 2º critério de desempate
          { acertosResultado: "desc" },  // 3º critério de desempate
          { user: { createdAt: "asc" } }, // 4º critério de desempate
        ],
        skip,
        take: limit,
      }),
      prisma.bolaoScore.count({
        where: { bolaoId },
      }),
    ]);

    return NextResponse.json({
      ranking,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[GET /api/bolao/[bolaoId]/ranking] Erro:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
