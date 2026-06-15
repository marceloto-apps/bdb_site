import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession } from '@/lib/stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID é obrigatório'),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Você precisa estar autenticado.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const parsed = checkoutSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Price ID inválido ou ausente.' },
        { status: 400 }
      )
    }

    const { priceId } = parsed.data

    // Validar se o priceId enviado é um dos preços válidos configurados no .env
    const priceBasico = process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO
    const pricePro = process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO

    if (priceId !== priceBasico && priceId !== pricePro) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'O ID de preço fornecido não é válido.' },
        { status: 400 }
      )
    }

    // Buscar o email e stripeCustomerId do usuário do banco de dados
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, stripeCustomerId: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado.' },
        { status: 404 }
      )
    }

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${origin}/dashboard/plano?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/planos`

    const checkoutSession = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      priceId,
      stripeCustomerId: user.stripeCustomerId,
      successUrl,
      cancelUrl,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('[POST /api/checkout] Erro ao criar checkout session:', error)
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Erro interno ao criar sessão de checkout.' },
      { status: 500 }
    )
  }
}
