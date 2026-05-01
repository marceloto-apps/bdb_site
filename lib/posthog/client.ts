import posthog, { PostHog } from 'posthog-js'

// Flag interna para garantir init único (HMR/StrictMode safe)
let initialized = false

/**
 * Inicializa e retorna o singleton do PostHog.
 * SEMPRE retorna o objeto `posthog` importado, nunca o retorno de `init`.
 *
 * Notas:
 * - posthog.init() não retorna o singleton público de forma confiável.
 * - O posthog-js moderno não popula window.posthog automaticamente,
 *   por isso expomos manualmente em dev para facilitar o debug.
 */
export function getPosthogClient(): PostHog | null {
  // Não executa no servidor
  if (typeof window === 'undefined') return null

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  // const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!key) {
    console.warn('[PostHog] NEXT_PUBLIC_POSTHOG_KEY ausente — analytics desativado')
    return null
  }

  // Inicializa apenas uma vez (protege contra StrictMode e HMR)
  if (!initialized) {
    posthog.init(key, {
      api_host: '/ingest',                          // ← Reverse proxy (evita adblockers)
      ui_host: 'https://us.posthog.com',            // ← NOVO: para links do PostHog (toolbar, etc)
      capture_pageview: false, // pageviews são disparados manualmente pelo provider
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      loaded: (ph) => {
        // Confirma init bem-sucedido
        console.log('[PostHog] ✅ Inicializado via reverse proxy e pronto para capturar eventos')

        // Em desenvolvimento, expõe no window e ativa logs verbosos
        if (process.env.NODE_ENV === 'development') {
          ;(window as unknown as { posthog: PostHog }).posthog = ph
          ph.debug()
        }
      },
    })
    initialized = true
  }

  // SEMPRE retorna o singleton importado, não o retorno de init
  return posthog
}
