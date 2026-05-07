import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface BannerModeloWarningProps {
  nbWarning: 'FALLBACK_PARCIAL_HOME' | 'FALLBACK_PARCIAL_AWAY' | 'FALLBACK_TOTAL' | null
  rhoClamped: boolean
  modeloAutoConfianca?: 'ALTA' | 'MEDIA' | 'BAIXA' | null
  modeloSelecionado: string
}

export function BannerModeloWarning({
  nbWarning,
  rhoClamped,
  modeloAutoConfianca,
  modeloSelecionado
}: BannerModeloWarningProps) {
  const alerts = []

  // 1. Fallback da Binomial Negativa
  if (modeloSelecionado === 'NB') {
    if (nbWarning === 'FALLBACK_TOTAL') {
      alerts.push(
        <Alert key="nb-total" variant="destructive" className="bg-orange-50 border-orange-200 text-orange-900">
          <AlertTriangle className="h-4 w-4 stroke-orange-600" />
          <AlertTitle className="text-orange-800">Binomial Negativa Indisponível</AlertTitle>
          <AlertDescription>
            Poisson assumiu totalmente os cálculos por ausência de sobredispersão estatística em ambos os times.
          </AlertDescription>
        </Alert>
      )
    } else if (nbWarning === 'FALLBACK_PARCIAL_HOME' || nbWarning === 'FALLBACK_PARCIAL_AWAY') {
      const lado = nbWarning === 'FALLBACK_PARCIAL_HOME' ? 'mandante' : 'visitante'
      alerts.push(
        <Alert key="nb-parcial" variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-900">
          <AlertCircle className="h-4 w-4 stroke-yellow-600" />
          <AlertTitle className="text-yellow-800">Fallback Parcial Acionado</AlertTitle>
          <AlertDescription>
            O time {lado} utilizou Poisson por ausência de sobredispersão. Apenas um dos lados utilizou a Binomial Negativa.
          </AlertDescription>
        </Alert>
      )
    }
  }

  // 2. Clamp do Dixon-Coles
  if (modeloSelecionado === 'DIXON_COLES' && rhoClamped) {
    alerts.push(
      <Alert key="dc-clamp" variant="default" className="bg-blue-50 border-blue-200 text-blue-900">
        <Info className="h-4 w-4 stroke-blue-600" />
        <AlertTitle className="text-blue-800">Ajuste de Correlação</AlertTitle>
        <AlertDescription>
          A correlação empírica (ρ) foi matematicamente ajustada para garantir estabilidade e coerência das probabilidades marginais.
        </AlertDescription>
      </Alert>
    )
  }

  // 3. Confiança do AUTO
  if (modeloAutoConfianca === 'BAIXA') {
    alerts.push(
      <Alert key="auto-baixa" variant="default" className="bg-blue-50 border-blue-200 text-blue-900">
        <Info className="h-4 w-4 stroke-blue-600" />
        <AlertTitle className="text-blue-800">Baixa Confiança Estatística</AlertTitle>
        <AlertDescription>
          Os modelos estão muito próximos em precisão (Delta AIC &lt; 2). Considere avaliar outros modelos manualmente para este confronto específico.
        </AlertDescription>
      </Alert>
    )
  }

  if (alerts.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {alerts}
    </div>
  )
}
