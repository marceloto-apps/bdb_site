import { getPosthogClient } from './client'

/**
 * Registra o evento de cadastro
 */
export function trackSignUp(method: 'credentials' | 'google') {
  const posthog = getPosthogClient()
  if (posthog) {
    posthog.capture('user_signed_up', { method })
  }
}

/**
 * Registra o evento de login
 */
export function trackLogin(method: 'credentials' | 'google') {
  const posthog = getPosthogClient()
  if (posthog) {
    posthog.capture('user_logged_in', { method })
  }
}

/**
 * Registra a visualização de página (SPA manual)
 */
export function trackPageView(url: string, referrer?: string) {
  const posthog = getPosthogClient()
  if (posthog) {
    posthog.capture('$pageview', {
      $current_url: url,
      $referrer: referrer,
    })
  }
}

/**
 * Registra alteração de plano de assinatura
 */
export function trackPlanChange(from: string, to: string) {
  const posthog = getPosthogClient()
  if (posthog) {
    posthog.capture('plan_changed', { from_plan: from, to_plan: to })
  }
}

/**
 * Registra leitura de artigo no CMS
 */
export function trackArticleView(slug: string, category: string) {
  const posthog = getPosthogClient()
  if (posthog) {
    posthog.capture('article_viewed', { slug, category })
  }
}

/**
 * Registra uso de ferramentas da plataforma (ex: simuladores, planilhas)
 */
export function trackToolUsage(toolName: string, filters?: Record<string, unknown>) {
  const posthog = getPosthogClient()
  if (posthog) {
    posthog.capture('tool_used', { tool_name: toolName, ...filters })
  }
}
