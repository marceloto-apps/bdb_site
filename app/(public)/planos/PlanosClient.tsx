'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Sparkles, Trophy, Star, ShieldAlert, Award } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
}

export function PlanosClient({ userSession, priceIds }: PlanosClientProps) {
  const router = useRouter()
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string) => {
    if (!userSession) {
      // Redirecionar para o login se não estiver autenticado
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

  const getButtonText = (planType: 'FREE' | 'VIP_BASICO' | 'VIP_PRO', _priceId?: string) => {
    if (!userSession) return 'Assinar agora'
    if (userSession.isLegacy) return 'Acesso Vitalício Ativo'
    
    if (userSession.plan === planType) {
      return 'Seu Plano Atual'
    }

    // Se o usuário já tiver um plano superior, mostra "Downgrade" ou similar no gerenciamento
    if (userSession.plan === 'VIP_PRO' && planType === 'VIP_BASICO') {
      return 'Gerenciar no Painel'
    }

    return 'Fazer Upgrade'
  }

  const isButtonDisabled = (planType: 'FREE' | 'VIP_BASICO' | 'VIP_PRO') => {
    if (!userSession) return false
    if (userSession.isLegacy) return true
    if (userSession.plan === planType) return true
    if (userSession.plan === 'VIP_PRO' && planType === 'VIP_BASICO') return true
    return false
  }

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-12 px-4 md:px-8">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {/* Plano Free */}
        <Card className="flex flex-col justify-between border bg-card/40 backdrop-blur-sm relative transition-all duration-200 hover:border-zinc-800">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-zinc-500" />
              Plano Free
            </CardTitle>
            <CardDescription>Acesso inicial gratuito para testes</CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-extrabold text-white">R$ 0</span>
              <span className="text-zinc-500 text-sm">/ sempre</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Brasileirão Série A incluso</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Estatísticas básicas de times</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Médias de gols e cantos da liga</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
            <Button 
              disabled={userSession ? true : false} 
              variant="outline" 
              className="w-full font-semibold border-zinc-800 hover:bg-zinc-900"
              onClick={() => router.push('/login')}
            >
              {userSession ? 'Já Possui Acesso' : 'Começar Grátis'}
            </Button>
          </CardFooter>
        </Card>

        {/* Plano VIP Básico */}
        <Card className="flex flex-col justify-between border-2 border-primary bg-card/60 backdrop-blur-sm relative transition-all duration-200 shadow-2xl shadow-primary/5">
          <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2">
            <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold flex items-center gap-1 py-1 px-3 text-xs shadow-md">
              <Star className="w-3 h-3 fill-current" />
              Recomendado
            </Badge>
          </div>
          
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              VIP Básico
            </CardTitle>
            <CardDescription>Acesso total às análises das ligas VIP</CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-extrabold text-white">R$ 39,90</span>
              <span className="text-zinc-500 text-sm">/ mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="font-semibold text-white">Todas as 25+ ligas VIP inclusas</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Previsões Dixon-Coles e NB</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Filtros avançados (Odds, Rodadas, Meses)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Dados de xG e Mapa de Valor (Expected Value)</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
            <Button 
              disabled={isButtonDisabled('VIP_BASICO') || loadingPriceId !== null} 
              className="w-full font-semibold shadow-lg shadow-primary/20"
              onClick={() => handleSubscribe(priceIds.basico)}
            >
              {loadingPriceId === priceIds.basico ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                getButtonText('VIP_BASICO', priceIds.basico)
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Plano VIP Pro */}
        <Card className="flex flex-col justify-between border bg-card/40 backdrop-blur-sm relative transition-all duration-200 hover:border-zinc-800">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              VIP Pro
            </CardTitle>
            <CardDescription>Ferramentas avançadas de precificação</CardDescription>
            <div className="pt-4">
              <span className="text-4xl font-extrabold text-white">R$ 69,90</span>
              <span className="text-zinc-500 text-sm">/ mês</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Tudo do plano VIP Básico</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span className="font-semibold text-white">Calculadora Poisson-2.5 integrada</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Juice Tracker e ferramentas adicionais</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Suporte prioritário via WhatsApp</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
            <Button 
              disabled={isButtonDisabled('VIP_PRO') || loadingPriceId !== null} 
              variant="outline"
              className="w-full font-semibold border-zinc-800 hover:bg-zinc-900"
              onClick={() => handleSubscribe(priceIds.pro)}
            >
              {loadingPriceId === priceIds.pro ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                getButtonText('VIP_PRO', priceIds.pro)
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
