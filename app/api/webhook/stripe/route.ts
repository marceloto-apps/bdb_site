import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { Plan, SubscriptionStatus } from '@prisma/client'

// O webhook do Stripe requer o runtime clássico do Node.js (não Edge)
export const runtime = 'nodejs'

// Mapeador de Price IDs para Planos do Sistema
const getPlanFromPriceId = (priceId: string | null): Plan => {
  if (!priceId) return 'FREE'
  
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO) {
    return 'VIP_BASICO'
  }
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO) {
    return 'VIP_PRO'
  }
  
  return 'FREE'
}

// Mapeador de Status do Stripe para o Enum do Prisma
const mapStripeStatusToPrisma = (stripeStatus: string): SubscriptionStatus => {
  const status = stripeStatus.toUpperCase()
  const validStatuses = ['ACTIVE', 'PAST_DUE', 'CANCELED', 'INCOMPLETE', 'TRIALING', 'UNPAID']
  if (validStatuses.includes(status)) {
    return status as SubscriptionStatus
  }
  return 'CANCELED'
}

// Auxiliar para verificar e vincular legado por userId ou email
const checkAndLinkLegacy = async (userId: string, email: string | null, legacyAccessRelation: any): Promise<boolean> => {
  if (legacyAccessRelation !== null) return true
  if (!email) return false
  
  const legacyByEmail = await prisma.legacyAccess.findUnique({
    where: { email },
  })
  
  if (legacyByEmail) {
    try {
      await prisma.legacyAccess.update({
        where: { email },
        data: { userId },
      })
    } catch (err) {
      console.error('[Stripe Webhook] Erro ao vincular LegacyAccess:', err)
    }
    return true
  }
  
  return false
}

export async function POST(req: Request) {
  let body: string
  try {
    body = await req.text()
  } catch (err) {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Não foi possível ler o corpo bruto do request' }, { status: 400 })
  }

  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'BAD_REQUEST', message: 'Assinatura stripe-signature ausente' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[Stripe Webhook] Erro na verificação da assinatura:', err.message)
    return NextResponse.json({ error: 'BAD_REQUEST', message: `Assinatura inválida: ${err.message}` }, { status: 400 })
  }

  const eventId = event.id

  // 1. Idempotência: Garante que o evento do Stripe não foi processado anteriormente
  try {
    await prisma.stripeWebhookEvent.create({
      data: { eventId }
    })
  } catch (error) {
    // Erro de restrição única P2002 do Prisma significa que o evento já foi processado.
    // Retornamos 200 OK para o Stripe parar de reenviar.
    console.log(`[Stripe Webhook] Evento duplicado ignorado: ${eventId}`)
    return NextResponse.json({ received: true, duplicate: true })
  }

  console.log(`[Stripe Webhook] Processando evento: ${event.type} (${eventId})`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId

        if (!userId) {
          console.warn('[Stripe Webhook] checkout.session.completed sem userId associado')
          break
        }

        const stripeCustomerId = session.customer as string
        const stripeSubscriptionId = session.subscription as string

        if (!stripeSubscriptionId) {
          console.warn('[Stripe Webhook] checkout.session.completed sem subscriptionId')
          break
        }

        // Buscar detalhes completos da assinatura diretamente na API do Stripe
        const subscription = (await stripe.subscriptions.retrieve(stripeSubscriptionId)) as any
        const priceId = subscription.items.data[0].price.id
        const userPlan = getPlanFromPriceId(priceId)

        // Atualizar o plano e o stripeCustomerId do Usuário
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId,
            plan: userPlan,
          },
        })

        // Upsert do registro da assinatura no banco
        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            stripeCustomerId,
            stripeSubscriptionId,
            stripePriceId: priceId,
            status: mapStripeStatusToPrisma(subscription.status),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          update: {
            stripeSubscriptionId,
            stripePriceId: priceId,
            status: mapStripeStatusToPrisma(subscription.status),
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        })

        console.log(`[Stripe Webhook] Assinatura criada para o usuário ${userId}. Plano: ${userPlan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const stripeSubscriptionId = subscription.id
        const stripeCustomerId = subscription.customer as string

        // Localizar a assinatura no banco de dados
        const dbSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
          include: { user: { include: { legacyAccess: true } } },
        })

        if (!dbSub) {
          console.warn(`[Stripe Webhook] Assinatura ${stripeSubscriptionId} não encontrada no banco`)
          break
        }

        const priceId = subscription.items.data[0].price.id
        const newPlan = getPlanFromPriceId(priceId)
        const newStatus = mapStripeStatusToPrisma(subscription.status)

        // Sincronizar dados da assinatura no banco
        await prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            stripePriceId: priceId,
            status: newStatus,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        })

        // Atualizar plano do usuário somente se ele NÃO possuir acesso legado.
        // Se for legado vitalício, o User.plan é mantido como VIP_PRO.
        const isLegacy = await checkAndLinkLegacy(dbSub.userId, dbSub.user.email, dbSub.user.legacyAccess)
        
        // Se a assinatura está ativa/trialing, atualizamos para o novo plano.
        // Caso contrário (suspensa/past_due/canceled), se não for legado rebaixamos para FREE.
        if (newStatus === 'ACTIVE' || newStatus === 'TRIALING') {
          await prisma.user.update({
            where: { id: dbSub.userId },
            data: { plan: newPlan },
          })
        } else if (!isLegacy) {
          await prisma.user.update({
            where: { id: dbSub.userId },
            data: { plan: 'FREE' },
          })
        }

        console.log(`[Stripe Webhook] Assinatura ${stripeSubscriptionId} atualizada. Status: ${newStatus}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const stripeSubscriptionId = subscription.id

        // Localizar a assinatura no banco de dados
        const dbSub = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
          include: { user: { include: { legacyAccess: true } } },
        })

        if (!dbSub) {
          console.warn(`[Stripe Webhook] Assinatura cancelada ${stripeSubscriptionId} não encontrada no banco`)
          break
        }

        // Marcar assinatura como cancelada
        await prisma.subscription.update({
          where: { stripeSubscriptionId },
          data: {
            status: 'CANCELED',
          },
        })

        // Rebaixar usuário para FREE, a menos que ele possua acesso legado (vitalício)
        const isLegacy = await checkAndLinkLegacy(dbSub.userId, dbSub.user.email, dbSub.user.legacyAccess)
        if (!isLegacy) {
          await prisma.user.update({
            where: { id: dbSub.userId },
            data: { plan: 'FREE' },
          })
        }

        console.log(`[Stripe Webhook] Assinatura cancelada/deletada: ${stripeSubscriptionId}. Plano de ${dbSub.userId} rebaixado para FREE. (Legado: ${isLegacy})`)
        break
      }

      default: {
        console.log(`[Stripe Webhook] Evento não tratado: ${event.type}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`[Stripe Webhook] Erro ao processar evento ${event.type}:`, error)
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: 'Erro ao processar as atualizações do banco de dados' }, { status: 500 })
  }
}
