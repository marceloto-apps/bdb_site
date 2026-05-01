import { Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ToolsPlaceholder() {
  return (
    <section className="border-t border-border py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <Badge variant="outline" className="mb-4 border-border text-text-muted">
          <Wrench className="mr-1 h-3.5 w-3.5" />
          Em breve
        </Badge>
        <h2 className="font-display text-2xl font-bold text-text-primary md:text-3xl">
          Calculadoras e ferramentas online
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          Calculadoras de Poisson, simuladores de gestão de banca e outras
          ferramentas interativas estão sendo desenvolvidas para esta seção.
        </p>
      </div>
    </section>
  )
}
