import { prisma } from '@/lib/prisma'

/**
 * Realiza o cleanup (lazy) do histórico de leitura de um usuário,
 * garantindo que apenas os 30 registros mais recentes sejam mantidos.
 */
export async function limparHistoricoExcedente(userId: string): Promise<void> {
  // Busca a data do 31º registro (offset 30, pega 1)
  const trigesimoPrimeiro = await prisma.readHistory.findFirst({
    where: { userId },
    orderBy: { readAt: 'desc' },
    skip: 30,
    select: { readAt: true },
  })

  // Se não existe 31º, não há o que limpar
  if (!trigesimoPrimeiro) return

  // Deleta tudo desse usuário que tenha readAt menor ou igual ao corte
  await prisma.readHistory.deleteMany({
    where: {
      userId,
      readAt: { lte: trigesimoPrimeiro.readAt },
    },
  })
}
