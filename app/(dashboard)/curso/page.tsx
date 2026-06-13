import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CoursePlayerClient } from "./CoursePlayerClient"
import { GraduationCap } from "lucide-react"

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

  // 2. Busca cursos publicados e suas respectivas estruturas (módulos e aulas)
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

  // 3. Normalização: cria um payload limpo sem expor as videoUrls cruas ao cliente
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
      lessons: mod.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        order: lesson.order,
        durationSec: lesson.durationSec,
        contentHtml: lesson.contentHtml,
        hasVideo: !!lesson.videoUrl, // Apenas envia a confirmação de que possui vídeo
      })),
    })),
  }))

  return (
    <div className="space-y-6 text-zinc-100 bg-zinc-950 p-6 rounded-lg min-h-screen">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GraduationCap className="text-amber-500 h-6 w-6" />
            Catálogo de Aulas e Cursos
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            Assista a vídeos, acesse materiais teóricos e evolua suas técnicas de aposta.
          </p>
        </div>
      </div>

      {/* Navegador/Player */}
      <CoursePlayerClient courses={safeCourses} />
    </div>
  )
}
