/**
 * Utilitário para enviar alertas ao canal/grupo administrativo do Telegram
 */
export async function sendTelegramAlert(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn("[Telegram Alert] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados no ambiente.")
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error(`[Telegram Alert] Erro do Telegram API: ${res.status} - ${errText}`)
      return false
    }

    console.log("[Telegram Alert] Mensagem enviada com sucesso ao Telegram.")
    return true
  } catch (error) {
    console.error("[Telegram Alert] Falha ao enviar mensagem:", error)
    return false
  }
}
