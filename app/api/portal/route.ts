import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createBillingPortalSession } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Você precisa estar autenticado.' },
        { status: 401 }
      )
    }

    // Buscar stripeCustomerId do usuário do banco de dados
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true },
    })

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Usuário não possui uma conta de faturamento ativa no Stripe.' },
        { status: 400 }
      )
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const returnUrl = `${origin}/dashboard/plano`

    const portalSession = await createBillingPortalSession({
      stripeCustomerId: user.stripeCustomerId,
      returnUrl,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('[POST /api/portal] Erro ao criar billing portal session:', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno ao criar sessão de portal de faturamento.' },
      { status: 500 }
    )
  }
}
