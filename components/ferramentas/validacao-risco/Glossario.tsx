import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

const termos = [
  {
    termo: 'Taxa de Sobrevivência',
    descricao: 'Porcentagem de simulações que não quebraram o limite. Acima de 95% é o ideal.',
    cor: 'text-primary',
  },
  {
    termo: 'P-Value',
    descricao: 'Chance de os resultados serem aleatórios. Menos que 0.05 indica validade estatística.',
    cor: 'text-data-yellow',
  },
  {
    termo: 'Volume Validador',
    descricao: 'Número de apostas para o ROI ser considerado estável.',
    cor: 'text-data-blue',
  },
  {
    termo: 'Score de Qualidade',
    descricao: 'Calculado como Lucro em Unidades / Drawdown Médio. Mede o retorno por unidade de risco histórico.',
    cor: 'text-primary',
  },
  {
    termo: 'DD Máximo (Pior)',
    descricao: 'O maior recuo de capital entre todas as simulações.',
    cor: 'text-data-red',
  },
]

export function Glossario() {
  return (
    <Card className="mt-6 border-border shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Glossário e Regras de Validação
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {termos.map((t) => (
            <div key={t.termo}>
              <span className={`text-sm font-bold ${t.cor}`}>{t.termo}: </span>
              <span className="text-sm text-muted-foreground">{t.descricao}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
