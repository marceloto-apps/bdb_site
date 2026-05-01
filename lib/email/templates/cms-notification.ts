/**
 * Template de notificação de mudança de status de artigo (CMS).
 * Será utilizado na Fase 1E quando o CMS for implementado.
 */

interface CmsNotificationParams {
  recipientName: string
  articleTitle: string
  oldStatus: string
  newStatus: string
  articleUrl?: string
}

export function cmsNotificationTemplate({
  recipientName,
  articleTitle,
  oldStatus,
  newStatus,
  articleUrl,
}: CmsNotificationParams) {
  const firstName = recipientName.split(' ')[0]

  const statusLabels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    REVISAO: 'Em revisão',
    PUBLICADO: 'Publicado',
  }

  return {
    subject: `Artigo "${articleTitle}" — ${statusLabels[newStatus] ?? newStatus}`,
    htmlContent: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0; padding:0; background-color:#0a0a0a; font-family:Arial, Helvetica, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a; padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a; border-radius:12px; overflow:hidden;">
                
                <tr>
                  <td style="background-color:#262626; padding:24px 32px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:20px;">Big Data Bet — CMS</h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px;">
                    <p style="color:#ffffff; font-size:15px; margin:0 0 16px;">
                      Olá, ${firstName}!
                    </p>
                    <p style="color:#a3a3a3; font-size:15px; line-height:1.6; margin:0 0 16px;">
                      O artigo <strong style="color:#ffffff;">"${articleTitle}"</strong> teve seu status alterado:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                      <tr>
                        <td style="padding:12px 16px; background-color:#262626; border-radius:8px;">
                          <span style="color:#a3a3a3; font-size:14px;">
                            \${statusLabels[oldStatus] ?? oldStatus}
                          </span>
                          <span style="color:#16a34a; font-size:14px; font-weight:bold;"> → </span>
                          <span style="color:#16a34a; font-size:14px; font-weight:bold;">
                            \${statusLabels[newStatus] ?? newStatus}
                          </span>
                        </td>
                      </tr>
                    </table>
                    \${articleUrl ? \`
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="background-color:#16a34a; border-radius:8px;">
                          <a href="\${articleUrl}"
                             style="display:inline-block; padding:12px 28px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:bold;">
                            Ver artigo →
                          </a>
                        </td>
                      </tr>
                    </table>
                    \` : ''}
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 32px; border-top:1px solid #333333; text-align:center;">
                    <p style="color:#666666; font-size:12px; margin:0;">
                      © \${new Date().getFullYear()} Big Data Bet — bigdatabet.com.br
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }
}
