"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { aulaSchema } from "@/lib/validations/aula"
import { quizQuestionsSchema } from "@/lib/validations/quiz"
import { awardPoints } from "@/lib/points/award"

/**
 * Helper para verificar privilégios de administrador ou editor
 */
async function requireAdminOrEditor() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("Acesso negado: Usuário não autenticado.")
  }
  const role = session.user.role
  if (role !== "ADMIN" && role !== "EDITOR") {
    throw new Error("Acesso negado: Apenas administradores ou editores.")
  }
  return session.user
}

// ==========================================
// COURSE CRUD
// ==========================================

export async function getCourses() {
  await requireAdminOrEditor()
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
  await requireAdminOrEditor()
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
  await requireAdminOrEditor()
  return await prisma.course.delete({
    where: { id }
  })
}

// ==========================================
// MODULE CRUD
// ==========================================

export async function getModules(courseId: string) {
  await requireAdminOrEditor()
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
  await requireAdminOrEditor()
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
  await requireAdminOrEditor()
  return await prisma.module.delete({
    where: { id }
  })
}

// ==========================================
// LESSON & QUIZ CRUD
// ==========================================

export async function getLessons(moduleId: string) {
  await requireAdminOrEditor()
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
  coverUrl?: string | null
  contentHtml?: string | null
  durationSec?: number | null
  quiz?: {
    passScore: number
    questions: any // JSON array
  } | null
}) {
  await requireAdminOrEditor()
  const { id, moduleId, title, order, videoUrl, coverUrl, contentHtml, durationSec, quiz } = data

  // 1. Validação dos dados da Aula via Zod
  const parsedAula = aulaSchema.safeParse({
    title,
    videoUrl: videoUrl || undefined,
    coverUrl: coverUrl || undefined,
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
    coverUrl: coverUrl || null,
    contentHtml: contentHtml || null,
    durationSec: durationSec || null
  }

  let lesson
  if (id) {
    // Removemos o moduleId no update para evitar erro de validação do Prisma
    const { moduleId: _, ...updatePayload } = payload
    lesson = await prisma.lesson.update({
      where: { id },
      data: updatePayload
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
  await requireAdminOrEditor()
  return await prisma.lesson.delete({
    where: { id }
  })
}

export async function toggleLessonProgress(lessonId: string, completed: boolean) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Acesso negado: Usuário não autenticado.")
  }
  const userId = session.user.id

  return await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    },
    update: {
      completed,
      completedAt: completed ? new Date() : null,
      watchedPct: completed ? 100 : 0
    },
    create: {
      userId,
      lessonId,
      completed,
      completedAt: completed ? new Date() : null,
      watchedPct: completed ? 100 : 0
    }
  })
}

/**
 * Salva a porcentagem assistida da aula. Se for >= 90%, marca como concluída e concede 50 pontos.
 */
export async function saveLessonProgress(lessonId: string, watchedPct: number) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Acesso negado: Usuário não autenticado.")
  }
  const userId = session.user.id

  // 1. Busca progresso atual
  const currentProgress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    }
  })

  // Se o progresso já estiver completo, não regredir a porcentagem nem estado
  if (currentProgress?.completed && watchedPct < 90) {
    return currentProgress
  }

  const isNowCompleted = watchedPct >= 90
  const shouldAwardPoints = isNowCompleted && !currentProgress?.completed

  const progress = await prisma.lessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    },
    update: {
      watchedPct,
      completed: isNowCompleted || (currentProgress?.completed ?? false),
      completedAt: isNowCompleted && !currentProgress?.completed ? new Date() : currentProgress?.completedAt
    },
    create: {
      userId,
      lessonId,
      watchedPct,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date() : null
    }
  })

  // 2. Conceder os pontos se acabou de completar a aula (>= 90%)
  if (shouldAwardPoints) {
    try {
      // Garantir que a regra de ponto COMPLETAR_AULA existe
      await prisma.pointRule.upsert({
        where: { action: "COMPLETAR_AULA" },
        update: {},
        create: {
          action: "COMPLETAR_AULA",
          label: "Assistir aula (+90%)",
          points: 50,
          countsToCap: true,
          active: true
        }
      })

      // Concede 50 pontos para a aula concluída
      await awardPoints(userId, "COMPLETAR_AULA", lessonId)
      console.log(`[saveLessonProgress] Concedido 50 pontos ao usuário ${userId} pela aula ${lessonId}`)
    } catch (err) {
      console.error("[saveLessonProgress] Erro ao conceder pontos:", err)
    }
  }

  return progress
}
