import { sendEmail } from "@/lib/email/brevo"
import { prisma } from "@/lib/prisma"

/**
 * Consulta todos os ADMIN e EDITOR no banco e envia um e-mail de alerta
 * informando sobre uma nova dúvida cadastrada na aula.
 */
export async function sendStaffEmailAlert(
  lessonTitle: string,
  authorName: string,
  authorEmail: string,
  content: string
): Promise<void> {
  try {
    // 1. Busca todos os usuários administradores e editores que possuem email
    const staff = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "EDITOR"]
        }
      },
      select: {
        email: true,
        name: true
      }
    })

    const activeStaff = staff.filter(member => !!member.email)

    if (activeStaff.length === 0) {
      console.log("[Email Alert] Nenhum membro da equipe (ADMIN/EDITOR) cadastrado para receber alertas.")
      return
    }

    // 2. Prepara o conteúdo HTML do e-mail
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #0c0a09; color: #f4f4f5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 22px;">💬 Nova Dúvida na Aula</h2>
          <p style="color: #a1a1aa; font-size: 14px; margin: 5px 0 0 0;">Um aluno enviou um novo comentário/dúvida no portal Big Data Bet.</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;" />
        <div style="font-size: 14px; line-height: 1.6; color: #e4e4e7;">
          <p style="margin: 8px 0;"><strong style="color: #a1a1aa;">Aula:</strong> ${lessonTitle}</p>
          <p style="margin: 8px 0;"><strong style="color: #a1a1aa;">Aluno:</strong> ${authorName} (${authorEmail})</p>
          <p style="margin: 16px 0 8px 0;"><strong style="color: #a1a1aa;">Dúvida enviada:</strong></p>
          <blockquote style="background-color: #1c1917; border-left: 4px solid #f59e0b; padding: 12px 18px; margin: 8px 0; border-radius: 4px; color: #d4d4d8; font-style: italic;">
            ${content.replace(/\n/g, "<br/>")}
          </blockquote>
        </div>
        <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;" />
        <div style="text-align: center; font-size: 11px; color: #71717a;">
          <p style="margin: 0;">Este é um alerta administrativo automático do portal Big Data Bet.</p>
        </div>
      </div>
    `

    // 3. Envia e-mails individualmente em paralelo
    await Promise.all(
      activeStaff.map(member => 
        sendEmail({
          to: { email: member.email!, name: member.name || undefined },
          subject: `[BDB Admin] Nova dúvida na aula: ${lessonTitle}`,
          htmlContent
        })
      )
    )

    console.log(`[Email Alert] Alertas enviados com sucesso para os ${activeStaff.length} membros da equipe.`)
  } catch (error) {
    console.error("[Email Alert] Erro inesperado ao disparar alertas por e-mail:", error)
  }
}
