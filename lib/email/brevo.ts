/**
 * Serviço centralizado de envio de emails via Brevo.
 * Todas as chamadas de email do projeto passam por aqui.
 */

import { BrevoClient } from '@getbrevo/brevo'

// Instância do cliente Brevo
const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!
});

// Tipagem dos parâmetros de envio
interface SendEmailParams {
  to: { email: string; name?: string }
  subject: string
  htmlContent: string
}

/**
 * Envia um email transacional via Brevo.
 * Retorna true se enviou com sucesso, false se falhou.
 * Nunca lança exceção — loga o erro e retorna false.
 */
export async function sendEmail({ to, subject, htmlContent }: SendEmailParams): Promise<boolean> {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL!,
        name: process.env.BREVO_SENDER_NAME!,
      },
      to: [{ email: to.email, name: to.name ?? to.email }],
      subject: subject,
      htmlContent: htmlContent
    })

    console.log(`[Brevo] Email enviado para ${to.email}: "${subject}"`)
    return true
  } catch (error) {
    console.error(`[Brevo] Falha ao enviar email para ${to.email}:`, error)
    return false
  }
}
