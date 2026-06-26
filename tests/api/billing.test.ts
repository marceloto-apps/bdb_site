import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { createCheckoutSession, createBillingPortalSession } from '@/lib/stripe'
import { POST as checkoutPOST } from '@/app/api/checkout/route'
import { POST as portalPOST } from '@/app/api/portal/route'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  createCheckoutSession: vi.fn(),
  createBillingPortalSession: vi.fn(),
}))

describe('Billing API Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_BASICO = 'price_basico_123'
    process.env.NEXT_PUBLIC_STRIPE_PRICE_VIP_PRO = 'price_pro_123'
  })

  describe('POST /api/checkout', () => {
    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      const mockedAuth = vi.mocked(auth) as unknown as Mock<() => Promise<any>>
      mockedAuth.mockResolvedValueOnce(null)

      const req = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId: 'price_basico_123' }),
      })

      const res = await checkoutPOST(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('UNAUTHORIZED')
    })

    it('deve retornar 400 se o priceId estiver ausente ou inválido', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user_123', email: 'test@example.com' },
      } as any)

      const req = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId: 'invalid_price' }),
      })

      const res = await checkoutPOST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('BAD_REQUEST')
      expect(data.message).toContain('não é válido')
    })

    it('deve retornar 404 se o usuário não for encontrado no banco de dados', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user_123', email: 'test@example.com' },
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

      const req = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId: 'price_basico_123' }),
      })

      const res = await checkoutPOST(req)
      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data.error).toBe('NOT_FOUND')
    })

    it('deve criar checkout session com sucesso e retornar a URL', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user_123', email: 'test@example.com' },
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user_123',
        email: 'test@example.com',
        stripeCustomerId: null,
      } as any)

      vi.mocked(createCheckoutSession).mockResolvedValueOnce({
        url: 'https://checkout.stripe.com/pay/cs_123',
      } as any)

      const req = new Request('http://localhost/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId: 'price_basico_123' }),
        headers: {
          origin: 'http://localhost:3000',
        },
      })

      const res = await checkoutPOST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_123')

      expect(createCheckoutSession).toHaveBeenCalledWith({
        userId: 'user_123',
        userEmail: 'test@example.com',
        priceId: 'price_basico_123',
        stripeCustomerId: null,
        successUrl: 'http://localhost:3000/dashboard/plano?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: 'http://localhost:3000/planos',
      })
    })
  })

  describe('POST /api/portal', () => {
    it('deve retornar 401 se o usuário não estiver autenticado', async () => {
      const mockedAuth = vi.mocked(auth) as unknown as Mock<() => Promise<any>>
      mockedAuth.mockResolvedValueOnce(null)

      const req = new Request('http://localhost/api/portal', {
        method: 'POST',
      })

      const res = await portalPOST(req)
      expect(res.status).toBe(401)
      const data = await res.json()
      expect(data.error).toBe('UNAUTHORIZED')
    })

    it('deve retornar 400 se o usuário não possuir stripeCustomerId', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user_123', email: 'test@example.com' },
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        stripeCustomerId: null,
      } as any)

      const req = new Request('http://localhost/api/portal', {
        method: 'POST',
      })

      const res = await portalPOST(req)
      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toBe('BAD_REQUEST')
      expect(data.message).toContain('não possui uma conta de faturamento ativa')
    })

    it('deve criar portal session com sucesso e retornar a URL', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: 'user_123', email: 'test@example.com' },
      } as any)

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        stripeCustomerId: 'cus_123',
      } as any)

      vi.mocked(createBillingPortalSession).mockResolvedValueOnce({
        url: 'https://billing.stripe.com/p/session_123',
      } as any)

      const req = new Request('http://localhost/api/portal', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
        },
      })

      const res = await portalPOST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.url).toBe('https://billing.stripe.com/p/session_123')

      expect(createBillingPortalSession).toHaveBeenCalledWith({
        stripeCustomerId: 'cus_123',
        returnUrl: 'http://localhost:3000/dashboard/plano',
      })
    })
  })
})
