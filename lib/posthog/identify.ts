import { getPosthogClient } from './client'

interface IdentifyUserParams {
  id: string
  email?: string | null
  name?: string | null
  plan?: string
  role?: string
}

/**
 * Identifica o usuário no PostHog para unificar sessões pré e pós login
 */
export function identifyUser({ id, email, name, plan, role }: IdentifyUserParams) {
  const posthog = getPosthogClient()
  if (!posthog) return

  posthog.identify(id, {
    email: email ?? undefined,
    name: name ?? undefined,
    plan,
    role,
  })
}

/**
 * Reseta a identificação do usuário no PostHog (usado no logout)
 */
export function resetUser() {
  const posthog = getPosthogClient()
  if (!posthog) return

  posthog.reset()
}
