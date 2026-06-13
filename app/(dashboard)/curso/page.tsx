import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CoursePlayerClient } from "./CoursePlayerClient"

export const metadata = {
  title: "Aulas e Cursos — Big Data Bet",
  description: "Acesse nosso catálogo completo de aulas e materiais didáticos exclusivos.",
}

export default async function CursoPage() {
  // 1. Exige autenticação do usuário
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  // 2. Busca o progresso do usuário para todas as aulas
  const progressList = await prisma.lessonProgress.findMany({
    where: { userId },
    select: {
      lessonId: true,
      completed: true,
      watchedPct: true,
    },
  })

  // 3. Busca cursos publicados e suas respectivas estruturas (módulos e aulas)
  const coursesData = await prisma.course.findMany({
    where: { published: true },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  })

  // 4. Normalização: cria um payload limpo sem expor as videoUrls cruas ao cliente, incluindo o status de progresso
  const safeCourses = coursesData.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    coverUrl: course.coverUrl,
    access: course.access,
    modules: course.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      order: mod.order,
      lessons: mod.lessons.map((lesson) => {
        const progress = progressList.find((p) => p.lessonId === lesson.id)
        return {
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          durationSec: lesson.durationSec,
          contentHtml: lesson.contentHtml,
          hasVideo: !!lesson.videoUrl, // Apenas envia a confirmação de que possui vídeo
          completed: progress ? progress.completed : false,
          watchedPct: progress ? progress.watchedPct : 0,
        }
      }),
    })),
  }))

  return (
    <div className="text-zinc-100 bg-zinc-950 rounded-lg min-h-screen">
      {/* O cabeçalho é gerenciado dentro do CoursePlayerClient para alternar entre Vitrine e Player */}
      <CoursePlayerClient courses={safeCourses} />
    </div>
  )
}
