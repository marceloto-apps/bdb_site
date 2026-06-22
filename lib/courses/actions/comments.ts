"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendTelegramAlert } from "@/lib/notifications/telegram"
import { sendStaffEmailAlert } from "@/lib/notifications/email"

/**
 * Busca todos os comentários e respostas associados a uma aula.
 */
export async function getLessonComments(lessonId: string) {
  try {
    const comments = await prisma.lessonComment.findMany({
      where: { lessonId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: "asc" // Ordem cronológica para que as discussões façam sentido
      }
    })

    return comments
  } catch (error) {
    console.error("[getLessonComments] Erro ao buscar comentários:", error)
    throw new Error("Não foi possível carregar os comentários.")
  }
}

/**
 * Cria um comentário ou resposta na aula.
 */
export async function createLessonComment(data: {
  lessonId: string
  content: string
  parentId?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Acesso negado: Usuário não autenticado.")
  }

  const { lessonId, content, parentId } = data

  if (!content || content.trim().length === 0) {
    throw new Error("O comentário não pode estar em branco.")
  }

  const userId = session.user.id
  const userRole = session.user.role
  const userName = session.user.name || "Aluno"
  const userEmail = session.user.email || ""

  // REGRA DE NEGÓCIO: Somente ADMIN ou EDITOR podem responder a outras dúvidas (parentId fornecido)
  if (parentId) {
    if (userRole !== "ADMIN" && userRole !== "EDITOR") {
      throw new Error("Acesso negado: Apenas administradores e editores podem responder a dúvidas.")
    }
  }

  // Criação do comentário/dúvida no banco de dados
  const newComment = await prisma.lessonComment.create({
    data: {
      lessonId,
      userId,
      content: content.trim(),
      parentId: parentId || null
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true
        }
      },
      lesson: {
        select: {
          title: true
        }
      }
    }
  })

  // Disparar alertas somente se for uma dúvida/pergunta nova (parentId === null)
  // para evitar e-mails e telegrams redundantes de respostas criadas pela própria equipe.
  if (!parentId) {
    const lessonTitle = newComment.lesson.title

    // 1. Alerta Telegram
    const telegramMessage = `💬 <b>Nova Dúvida/Comentário na Aula!</b>\n\n<b>Aula:</b> ${lessonTitle}\n<b>Usuário:</b> ${userName} (${userEmail})\n<b>Comentário:</b>\n<i>"${content.trim()}"</i>`
    await sendTelegramAlert(telegramMessage)

    // 2. Alerta por E-mail (Brevo)
    await sendStaffEmailAlert(lessonTitle, userName, userEmail, content.trim())
  }

  return newComment
}
