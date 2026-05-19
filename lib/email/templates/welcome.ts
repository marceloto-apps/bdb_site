/**
 * Template de email de boas-vindas enviado no cadastro.
 */

interface WelcomeEmailParams {
  name: string
}

export function welcomeEmailTemplate({ name }: WelcomeEmailParams) {
  const firstName = name.split(' ')[0]

  return {
    subject: `Bem-vindo à Big Data Bet, ${firstName}! 🎯`,
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
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #16a34a, #059669); padding:32px; text-align:center;">
                    <h1 style="color:#ffffff; margin:0; font-size:24px;">Big Data Bet</h1>
                    <p style="color:#d1fae5; margin:8px 0 0; font-size:14px;">Análise esportiva baseada em dados</p>
                  </td>
                </tr>

                <!-- Conteúdo -->
                <tr>
                  <td style="padding:32px;">
                    <h2 style="color:#ffffff; margin:0 0 16px; font-size:20px;">
                      Fala, ${firstName}! 👋
                    </h2>
                    <p style="color:#a3a3a3; font-size:15px; line-height:1.6; margin:0 0 16px;">
                      Sua conta foi criada com sucesso. Agora você tem acesso ao conteúdo gratuito da plataforma.
                    </p>
                    <p style="color:#a3a3a3; font-size:15px; line-height:1.6; margin:0 0 24px;">
                      Na Big Data Bet você encontra análises, estudos e ferramentas para tomar decisões mais inteligentes nas suas apostas esportivas.
                    </p>

                    <!-- CTA -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="background-color:#16a34a; border-radius:8px;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bigdatabet.com.br'}/dashboard"
                             style="display:inline-block; padding:14px 32px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:bold;">
                            Acessar a plataforma →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Comunidade -->
                <tr>
                  <td style="padding:0 32px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#262626; border-radius:8px; padding:20px;">
                      <tr>
                        <td>
                          <p style="color:#ffffff; font-size:14px; font-weight:bold; margin:0 0 8px;">
                            Junte-se à comunidade 🚀
                          </p>
                          <p style="color:#a3a3a3; font-size:13px; line-height:1.5; margin:0;">
                            Telegram · YouTube · Instagram<br/>
                            Conteúdo diário, análises ao vivo e discussões.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:24px 32px; border-top:1px solid #333333; text-align:center;">
                    <p style="color:#666666; font-size:12px; margin:0;">
                      © ${new Date().getFullYear()} Big Data Bet — bigdatabet.com.br
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
