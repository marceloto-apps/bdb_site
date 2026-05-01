import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BarChart, FlaskConical, GraduationCap } from "lucide-react"

export function SolutionSection() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
          A Big Data Bet busca tornar este mercado melhor.
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-surface border-border flex flex-col hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Encontre os desajustes</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground leading-relaxed">
                As casas de apostas erram. Apostadores menos informados inflam um lado da linha e abrem brechas do outro. Aplicamos técnicas estatísticas para identificar essas pequenas falhas — os momentos em que as odds não refletem a probabilidade real. É nesses desajustes que mora a vantagem.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-border flex flex-col hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FlaskConical className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Valide antes de arriscar</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground leading-relaxed">
                Ter uma ideia não basta — é preciso provar que ela funciona. Ferramentas de backtest para testar estratégias contra dados históricos reais e ferramentas de gestão de risco para dimensionar exposição e proteger sua banca. Sem validação, não existe método — existe esperança.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-surface border-border flex flex-col sm:col-span-2 lg:col-span-1 hover:border-primary/30 transition-colors">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Aprenda a construir seus próprios métodos</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground leading-relaxed">
                Conteúdo didático, passo a passo, orientado a dados. Você aprende a criar métodos, validar com dados reais e colocar para rodar com confiança. Sem pré-requisito de programação. O objetivo é autonomia: você sai daqui sabendo operar por conta própria.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
