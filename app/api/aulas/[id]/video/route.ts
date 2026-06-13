// app/api/aulas/[id]/video/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth"; // Setup do NextAuth v5
import { prisma } from "@/lib/prisma";
import { extrairYoutubeId, gerarEmbedUrl } from "@/lib/video/youtube";
import { extrairBunnyId, gerarBunnyEmbedUrl } from "@/lib/video/bunny";

/**
 * GET /api/aulas/[id]/video
 * Retorna a URL de embed protegida de uma aula se o usuário for autenticado e elegível.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Exige sessão autenticada
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  }

  // 2. Busca a aula e o acesso do curso relacionado
  const aula = await prisma.lesson.findUnique({
    where: { id: params.id },
    select: {
      videoUrl: true,
      module: {
        select: {
          course: {
            select: {
              access: true,
            },
          },
        },
      },
    },
  });

  if (!aula) {
    return NextResponse.json({ erro: "Aula não encontrada" }, { status: 404 });
  }

  if (!aula.videoUrl) {
    return NextResponse.json({ erro: "Aula sem vídeo cadastrado" }, { status: 404 });
  }

  // 3. Validação de plano / role
  //    No momento (vídeos free), todos os autenticados podem ver.
  //    Preparamos a estrutura de verificação com TODOs para a fase paga.
  const courseAccess = aula.module?.course?.access;
  const userPlan = (session.user as any).plan || "FREE";
  const userRole = (session.user as any).role || "MEMBRO";

  // Admins sempre têm acesso total
  if (userRole !== "ADMIN") {
    // Se o curso exige plano VIP Pro
    if (courseAccess === "INCLUSO_PRO") {
      if (userPlan !== "VIP_PRO") {
        // TODO Fase paga: Bloquear acesso se plano insuficiente
        // return NextResponse.json({ erro: "Acesso restrito ao plano VIP Pro" }, { status: 403 });
      }
    }
    // Se o curso exige plano VIP Básico
    else if (courseAccess === "INCLUSO_BASICO") {
      if (userPlan !== "VIP_BASICO" && userPlan !== "VIP_PRO") {
        // TODO Fase paga: Bloquear acesso se plano insuficiente
        // return NextResponse.json({ erro: "Acesso restrito ao plano VIP Básico" }, { status: 403 });
      }
    }
    // Se o curso for vendido de forma avulsa
    else if (courseAccess === "AVULSO") {
      // TODO Fase paga: Verificar compra individual do curso/aula
      // return NextResponse.json({ erro: "Curso avulso não adquirido" }, { status: 403 });
    }
  }

  // 4. Gera embed protegido (YouTube ou Bunny.net) sem expor a URL original salva
  const youtubeId = extrairYoutubeId(aula.videoUrl);
  if (youtubeId) {
    return NextResponse.json({ embedUrl: gerarEmbedUrl(youtubeId) });
  }

  const bunnyInfo = extrairBunnyId(aula.videoUrl);
  if (bunnyInfo) {
    return NextResponse.json({ 
      embedUrl: gerarBunnyEmbedUrl(bunnyInfo.libraryId, bunnyInfo.videoId) 
    });
  }

  return NextResponse.json({ erro: "URL de vídeo inválida ou não suportada" }, { status: 422 });
}
