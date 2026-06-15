import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_secret_key', {
  apiVersion: '2026-05-27.dahlia' as any,
  typescript: true,
})

interface CheckoutSessionParams {
  userId: string
  userEmail: string
  priceId: string
  stripeCustomerId?: string | null
  successUrl: string
  cancelUrl: string
}

/**
 * Cria uma nova Checkout Session no Stripe para assinaturas.
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  stripeCustomerId,
  successUrl,
  cancelUrl,
}: CheckoutSessionParams) {
  // Se o usuário já tiver um stripeCustomerId cadastrado, usamos ele.
  // Caso contrário, passamos o customer_email para criar o cliente associado ao email dele.
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    client_reference_id: userId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
    subscription_data: {
      metadata: {
        userId,
      },
    },
  })

  return session
}

interface BillingPortalParams {
  stripeCustomerId: string
  returnUrl: string
}

/**
 * Cria uma nova Billing Portal Session no Stripe para gerenciar assinaturas.
 */
export async function createBillingPortalSession({
  stripeCustomerId,
  returnUrl,
}: BillingPortalParams) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })

  return session
}
