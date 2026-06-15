'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Sparkles, Star, ShieldAlert, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  priceCents: number
  stripePriceId: string
  description: string | null
  features: string // JSON string array
  order: number
  active: boolean
}

interface PlanosClientProps {
  userSession: {
    id: string
    plan: 'FREE' | 'VIP_BASICO' | 'VIP_PRO'
    isLegacy: boolean
  } | null
  priceIds: {
    basico: string
    pro: string
  }
  plans?: Plan[]
}

export function PlanosClient({ userSession, priceIds, plans = [] }: PlanosClientProps) {
  const router = useRouter()
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string) => {
    if (!userSession) {
      router.push('/login?callbackUrl=/planos')
      return
    }

    setLoadingPriceId(priceId)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao iniciar o checkout.')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Não foi possível gerar a URL de checkout.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Houve um erro ao processar o seu pedido. Tente novamente.')
      setLoadingPriceId(null)
    }
  }

  const getButtonText = (planName: string, stripePriceId: string) => {
    if (!userSession) return 'Assinar agora'
    if (userSession.isLegacy) return 'Acesso Vitalício Ativo'
    
    const isBasico = planName.toLowerCase().includes('básico') || planName.toLowerCase().includes('basico')
    const isPro = planName.toLowerCase().includes('pro')

    if (userSession.plan === 'VIP_PRO' && isPro) return 'Seu Plano Atual'
    if (userSession.plan === 'VIP_BASICO' && isBasico) return 'Seu Plano Atual'

    if (userSession.plan === 'VIP_PRO' && isBasico) {
      return 'Gerenciar no Painel'
    }

    return 'Fazer Upgrade'
  }

  const isButtonDisabled = (planName: string) => {
    if (!userSession) return false
    if (userSession.isLegacy) return true
    
    const isBasico = planName.toLowerCase().includes('básico') || planName.toLowerCase().includes('basico')
    const isPro = planName.toLowerCase().includes('pro')

    if (userSession.plan === 'VIP_PRO' && isPro) return true
    if (userSession.plan === 'VIP_BASICO' && isBasico) return true
    if (userSession.plan === 'VIP_PRO' && isBasico) return true // bloqueia downgrade direto pelo checkout
    return false
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Se não houver planos ativos no banco, exibe a tela de "Planos em Breve" (ocultação total de preços)
  if (plans.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 md:px-8 bg-background">
        <Card className="max-w-2xl w-full border bg-card/40 backdrop-blur-sm shadow-xl p-8 text-center space-y-6 relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex w-16 h-16 rounded-full bg-primary/10 items-center justify-center border border-primary/20 mb-2 relative z-10">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white relative z-10">
            Planos VIP em <span className="text-primary">Breve</span>
          </h1>
          
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed relative z-10">
            Estamos preparando novidades incríveis, novos planos e ferramentas de precificação avançadas para potencializar suas análises esportivas.
          </p>
          
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 text-sm text-zinc-300 text-left space-y-2 relative z-10">
            <p className="font-semibold text-white flex items-center gap-1.5">
              💡 Acesso Liberado Temporariamente
            </p>
            <p className="text-xs text-zinc-400">
              No momento, o acesso completo para visualização de estatísticas avançadas, médias e previsões de confrontos das ligas:
            </p>
            <ul className="list-disc list-inside text-xs text-zinc-300 pl-1 space-y-1">
              <li><strong>Brasileirão Série A</strong></li>
              <li><strong>Brasileirão Série B</strong></li>
              <li><strong>División Profesional (Bolívia)</strong></li>
            </ul>
            <p className="text-xs text-zinc-400 pt-1">
              está gratuito para todos os usuários cadastrados na plataforma.
            </p>
          </div>
          
          <div className="pt-4 flex justify-center relative z-10">
            <Button asChild size="lg" className="font-semibold px-8 bg-[#22c55e] text-black hover:bg-[#16a34a]">
              <Link href="/dashboard">Ir para o Painel de Análises</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Se houver planos cadastrados e ativos no banco, renderiza dinamicamente as opções
  return (
    <div className="space-y-12 max-w-6xl mx-auto py-12 px-4 md:px-8 bg-background">
      <div className="text-center space-y-4">
        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary py-1 px-3 text-sm">
          Planos e Preços
        </Badge>
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-white">
          Escolha o Plano Ideal para Suas <span className="text-primary">Análises</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Desbloqueie ferramentas exclusivas, previsões baseadas em Poisson e Dixon-Coles, dados de xG e cantos em mais de 25 ligas VIP.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm flex items-center gap-3 max-w-xl mx-auto">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
        {plans.map((plan) => {
          let featuresList: string[] = []
          try {
            featuresList = JSON.parse(plan.features)
          } catch (e) {
            featuresList = []
          }

          const isBasico = plan.name.toLowerCase().includes('básico') || plan.name.toLowerCase().includes('basico')
          const isPro = plan.name.toLowerCase().includes('pro')

          return (
            <Card 
              key={plan.id} 
              className={`flex flex-col justify-between border bg-card/40 backdrop-blur-sm relative transition-all duration-200 hover:border-zinc-800 ${
                isBasico ? 'border-primary border-2 shadow-2xl shadow-primary/5' : ''
              }`}
            >
              {isBasico && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold flex items-center gap-1 py-1 px-3 text-xs shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                    Recomendado
                  </Badge>
                </div>
              )}
              
              <CardHeader className="space-y-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {isBasico ? (
                    <Sparkles className="w-5 h-5 text-primary" />
                  ) : (
                    <Award className="w-5 h-5 text-yellow-500" />
                  )}
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs min-h-[32px]">{plan.description}</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-extrabold text-white">
                    {formatPrice(plan.priceCents)}
                  </span>
                  <span className="text-zinc-500 text-sm">/ mês</span>
                </div>
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-3 text-sm text-zinc-300 mt-2">
                  {featuresList.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button 
                  disabled={isButtonDisabled(plan.name) || loadingPriceId !== null} 
                  className={`w-full font-semibold ${
                    isBasico 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-lg shadow-primary/20' 
                      : 'border border-zinc-800 hover:bg-zinc-900 bg-transparent text-white'
                  }`}
                  onClick={() => handleSubscribe(plan.stripePriceId)}
                >
                  {loadingPriceId === plan.stripePriceId ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    getButtonText(plan.name, plan.stripePriceId)
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
