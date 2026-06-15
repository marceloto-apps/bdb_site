'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, CheckCircle, ShieldAlert, Award, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

interface PlanoClientProps {
  user: {
    id: string
    name: string | null
    email: string | null
    plan: 'FREE' | 'VIP_BASICO' | 'VIP_PRO'
    legacyAccess: { id: string } | null
    subscription: SubscriptionData | null
  }
}

export function PlanoClient({ user }: PlanoClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isLegacy = !!user.legacyAccess

  const handlePortalRedirect = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portal', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Erro ao carregar o portal.')
      }
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('URL do portal não encontrada.')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Houve um problema ao redirecionar para o Stripe.')
      setLoading(false)
    }
  }

  // Formatação de data
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Obter status amigável da assinatura
  const getFriendlyStatus = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return { label: 'Ativa', variant: 'default' as const, className: 'bg-green-500/10 text-green-400 border-green-500/30' }
      case 'PAST_DUE':
        return { label: 'Atrasada', variant: 'destructive' as const, className: '' }
      case 'CANCELED':
        return { label: 'Cancelada', variant: 'secondary' as const, className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30' }
      case 'TRIALING':
        return { label: 'Período de Teste', variant: 'outline' as const, className: 'bg-blue-500/10 text-blue-400 border-blue-500/30' }
      default:
        return { label: status, variant: 'outline' as const, className: '' }
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-primary" />
          Gerenciamento de Assinatura
        </h1>
        <p className="text-muted-foreground text-lg">
          Consulte seu plano atual, histórico e detalhes de faturamento.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Card do Plano Atual */}
      <Card className="relative overflow-hidden border bg-card/50 backdrop-blur-sm shadow-xl">
        {/* Efeitos decorativos sutis */}
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
        
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardDescription>Seu plano ativo no momento</CardDescription>
              <CardTitle className="text-2xl font-display font-bold flex items-center gap-2 mt-1">
                {isLegacy ? (
                  <>
                    VIP Vitalício
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Vitalício
                    </Badge>
                  </>
                ) : user.plan === 'VIP_PRO' ? (
                  <>
                    VIP Pro
                    <Badge className="bg-primary text-primary-foreground font-semibold">PRO</Badge>
                  </>
                ) : user.plan === 'VIP_BASICO' ? (
                  <>
                    VIP Básico
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/30">Básico</Badge>
                  </>
                ) : (
                  <>
                    Plano Free
                    <Badge variant="outline">Membro</Badge>
                  </>
                )}
              </CardTitle>
            </div>
            
            {!isLegacy && user.plan !== 'FREE' && user.subscription && (
              <Badge className={getFriendlyStatus(user.subscription.status).className}>
                Assinatura {getFriendlyStatus(user.subscription.status).label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Informações detalhadas por tipo de plano */}
          {isLegacy ? (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Award className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-amber-200">Acesso Vitalício Garantido</h4>
                <p className="text-sm text-zinc-400">
                  Sua conta foi importada do Hubla e você possui acesso gratuito ilimitado para sempre. Não haverá cobranças recorrentes. Obrigado pela confiança!
                </p>
              </div>
            </div>
          ) : user.plan === 'FREE' ? (
            <div className="space-y-4">
              <p className="text-zinc-400">
                No plano gratuito, seu acesso é limitado às ligas Brasileirão Série A, Série B e División Profesional (Bolívia). Nossos planos VIP e ferramentas de precificação avançadas estarão disponíveis em breve para liberação de todas as 25+ ligas VIP nacionais e internacionais.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 border rounded-lg bg-zinc-900/40">
                  <h4 className="font-semibold text-zinc-200 flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Acesso Gratuito
                  </h4>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                    <li>Brasileirão Série A</li>
                    <li>Brasileirão Série B</li>
                    <li>División Profesional (Bolívia)</li>
                    <li>Estatísticas básicas de times</li>
                    <li>Acesso à comunidade</li>
                  </ul>
                </div>

                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <h4 className="font-semibold text-primary flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Recursos VIP (Em breve)
                  </h4>
                  <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                    <li>Mais de 25 ligas (Premier, LaLiga, etc.)</li>
                    <li>Gráfico Dixon-Coles e NB avançado</li>
                    <li>Análise detalhada de xG e cantos</li>
                    <li>Previsão de odds e valor esperado (EV)</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            // Usuário tem plano pago ativo pelo Stripe
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/30 border p-5 rounded-xl">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Período de faturamento atual</span>
                  <p className="font-medium text-zinc-200">
                    {user.subscription?.currentPeriodEnd 
                      ? `Até ${formatDate(user.subscription.currentPeriodEnd)}` 
                      : 'N/A'
                    }
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider">Renovação Automática</span>
                  <p className="font-medium text-zinc-200">
                    {user.subscription?.cancelAtPeriodEnd 
                      ? 'Desativada (sua assinatura será encerrada ao fim do período)' 
                      : 'Ativada'
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                <p className="text-xs text-zinc-500 text-center sm:text-left">
                  Gerencie dados de pagamento, altere seu plano ou cancele a assinatura diretamente pelo painel seguro do Stripe.
                </p>
                
                <Button 
                  onClick={handlePortalRedirect} 
                  disabled={loading} 
                  variant="outline" 
                  className="w-full sm:w-auto font-medium shrink-0 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    'Gerenciar Faturamento'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
