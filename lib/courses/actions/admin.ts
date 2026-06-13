"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { aulaSchema } from "@/lib/validations/aula"
import { quizQuestionsSchema } from "@/lib/validations/quiz"

/**
 * Helper para verificar privilégios de administrador
 */
async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Acesso negado: Apenas administradores.")
  }
  return session.user
}

// ==========================================
// COURSE CRUD
// ==========================================

export async function getCourses() {
  await requireAdmin()
  return await prisma.course.findMany({
    orderBy: { order: "asc" }
  })
}

export async function saveCourse(data: {
  id?: string
  slug: string
  title: string
  description?: string | null
  coverUrl?: string | null
  access: "GRATIS" | "INCLUSO_BASICO" | "INCLUSO_PRO" | "AVULSO"
  priceCents?: number | null
  pointsUnlockCost?: number | null
  published: boolean
  order: number
}) {
  await requireAdmin()
  const { id, slug, title, description, coverUrl, access, priceCents, pointsUnlockCost, published, order } = data

  const payload = {
    slug,
    title,
    description: description || null,
    coverUrl: coverUrl || null,
    access,
    priceCents: priceCents !== undefined ? priceCents : null,
    pointsUnlockCost: pointsUnlockCost !== undefined ? pointsUnlockCost : null,
    published,
    order
  }

  if (id) {
    return await prisma.course.update({
      where: { id },
      data: payload
    })
  } else {
    return await prisma.course.create({
      data: payload
    })
  }
}

export async function deleteCourse(id: string) {
  await requireAdmin()
  return await prisma.course.delete({
    where: { id }
  })
}

// ==========================================
// MODULE CRUD
// ==========================================

export async function getModules(courseId: string) {
  await requireAdmin()
  return await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: "asc" }
  })
}

export async function saveModule(data: {
  id?: string
  courseId: string
  title: string
  order: number
}) {
  await requireAdmin()
  const { id, courseId, title, order } = data

  const payload = {
    courseId,
    title,
    order
  }

  if (id) {
    return await prisma.module.update({
      where: { id },
      data: payload
    })
  } else {
    return await prisma.module.create({
      data: payload
    })
  }
}

export async function deleteModule(id: string) {
  await requireAdmin()
  return await prisma.module.delete({
    where: { id }
  })
}

// ==========================================
// LESSON & QUIZ CRUD
// ==========================================

export async function getLessons(moduleId: string) {
  await requireAdmin()
  return await prisma.lesson.findMany({
    where: { moduleId },
    include: {
      quiz: true
    },
    orderBy: { order: "asc" }
  })
}

export async function saveLesson(data: {
  id?: string
  moduleId: string
  title: string
  order: number
  videoUrl?: string | null
  contentHtml?: string | null
  durationSec?: number | null
  quiz?: {
    passScore: number
    questions: any // JSON array
  } | null
}) {
  await requireAdmin()
  const { id, moduleId, title, order, videoUrl, contentHtml, durationSec, quiz } = data

  // 1. Validação dos dados da Aula via Zod
  const parsedAula = aulaSchema.safeParse({
    title,
    videoUrl: videoUrl || undefined,
    contentHtml: contentHtml || undefined,
    durationSec: durationSec !== undefined && durationSec !== null ? Number(durationSec) : undefined,
  })

  if (!parsedAula.success) {
    throw new Error(
      `Dados da aula inválidos: ${parsedAula.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
    )
  }

  // 2. Validação das questões do Quiz via Zod se existir
  if (quiz && quiz.questions) {
    const parsedQuiz = quizQuestionsSchema.safeParse(quiz.questions)
    if (!parsedQuiz.success) {
      throw new Error(
        `Questões do quiz inválidas: ${parsedQuiz.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
      )
    }
  }

  const payload = {
    moduleId,
    title,
    order,
    videoUrl: videoUrl || null,
    contentHtml: contentHtml || null,
    durationSec: durationSec || null
  }

  let lesson
  if (id) {
    lesson = await prisma.lesson.update({
      where: { id },
      data: payload
    })
  } else {
    lesson = await prisma.lesson.create({
      data: payload
    })
  }

  if (quiz) {
    await prisma.quiz.upsert({
      where: { lessonId: lesson.id },
      update: {
        passScore: quiz.passScore,
        questions: quiz.questions
      },
      create: {
        lessonId: lesson.id,
        passScore: quiz.passScore,
        questions: quiz.questions
      }
    })
  } else {
    // Deletar quiz se desmarcado
    await prisma.quiz.deleteMany({
      where: { lessonId: lesson.id }
    })
  }

  return lesson
}

export async function deleteLesson(id: string) {
  await requireAdmin()
  return await prisma.lesson.delete({
    where: { id }
  })
}
