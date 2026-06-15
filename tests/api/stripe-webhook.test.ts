import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { POST } from '@/app/api/webhook/stripe/route'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stripeWebhookEvent: {
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    legacyAccess: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}))

describe('Stripe Webhook API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret'
    process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO = 'price_basico_123'
    process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO = 'price_pro_123'
  })

  it('deve retornar 400 se a assinatura do Stripe estiver ausente', async () => {
    const req = new Request('http://localhost/api/webhook/stripe', {
      method: 'POST',
      body: 'test-body',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('BAD_REQUEST')
    expect(data.message).toContain('Assinatura stripe-signature ausente')
  })

  it('deve retornar 200 e ignorar se o evento já foi processado (idempotência)', async () => {
    const req = new Request('http://localhost/api/webhook/stripe', {
      method: 'POST',
      body: 'test-body',
      headers: {
        'stripe-signature': 'sig_123',
      },
    })

    // Mockar verificação com sucesso
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      id: 'evt_123',
      type: 'checkout.session.completed',
    } as any)

    // Simular que o evento já existe (lança erro de chave única)
    vi.mocked(prisma.stripeWebhookEvent.create).mockRejectedValue(new Error('P2002 Unique constraint'))

    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.duplicate).toBe(true)
  })

  it('deve processar checkout.session.completed com sucesso', async () => {
    const req = new Request('http://localhost/api/webhook/stripe', {
      method: 'POST',
      body: 'test-body',
      headers: {
        'stripe-signature': 'sig_123',
      },
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          customer: 'cus_123',
          subscription: 'sub_123',
          client_reference_id: 'user_123',
        },
      },
    } as any)

    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      status: 'active',
      current_period_start: 1718000000,
      current_period_end: 1720000000,
      cancel_at_period_end: false,
      items: {
        data: [{ price: { id: 'price_pro_123' } }],
      },
    } as any)

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Verificar se persistiu idempotência
    expect(prisma.stripeWebhookEvent.create).toHaveBeenCalledWith({
      data: { eventId: 'evt_123' },
    })

    // Verificar se atualizou o usuário para VIP_PRO
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_123' },
      data: { stripeCustomerId: 'cus_123', plan: 'VIP_PRO' },
    })

    // Verificar se salvou assinatura
    expect(prisma.subscription.upsert).toHaveBeenCalled()
  })

  it('deve processar customer.subscription.deleted e rebaixar usuário comum para FREE', async () => {
    const req = new Request('http://localhost/api/webhook/stripe', {
      method: 'POST',
      body: 'test-body',
      headers: {
        'stripe-signature': 'sig_123',
      },
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      id: 'evt_123',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
        },
      },
    } as any)

    // Mockar retorno do banco localizando assinatura do usuário
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      userId: 'user_123',
      user: {
        id: 'user_123',
        email: 'user@example.com',
        legacyAccess: null, // NÃO é legado
      },
    } as any)

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Deve atualizar assinatura para CANCELED
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_123' },
      data: { status: 'CANCELED' },
    })

    // Deve atualizar plano do usuário para FREE
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_123' },
      data: { plan: 'FREE' },
    })
  })

  it('deve processar customer.subscription.deleted e MANTER plano VIP_PRO se for usuário legado', async () => {
    const req = new Request('http://localhost/api/webhook/stripe', {
      method: 'POST',
      body: 'test-body',
      headers: {
        'stripe-signature': 'sig_123',
      },
    })

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      id: 'evt_123',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
        },
      },
    } as any)

    // Mockar retorno do banco com legacyAccess ativo
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      userId: 'user_123',
      user: {
        id: 'user_123',
        email: 'legacy@example.com',
        legacyAccess: { id: 'leg_123' }, // É LEGADO
      },
    } as any)

    const res = await POST(req)
    expect(res.status).toBe(200)

    // Deve atualizar assinatura para CANCELED
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_123' },
      data: { status: 'CANCELED' },
    })

    // NÃO deve atualizar o plano do usuário para FREE
    expect(prisma.user.update).not.toHaveBeenCalledWith({
      where: { id: 'user_123' },
      data: { plan: 'FREE' },
    })
  })
})
