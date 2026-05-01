import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { CheckCircle2, ArrowRight } from "lucide-react"

export function AudienceSection() {
  return (
    <section className="py-20 bg-surface/30 border-y border-border">
      <div className="container px-4 md:px-6 mx-auto">
        <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
          Onde você está hoje?
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-background border-border flex flex-col group hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Tô começando</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">
                Aposto por hobby, já perdi dinheiro com tips e quero entender como usar dados de verdade.
              </p>
            </CardContent>
            <CardFooter>
              <a href="#" className="flex items-center text-primary font-medium hover:underline">
                Aqui é para você <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </CardFooter>
          </Card>
          
          <Card className="bg-background border-border flex flex-col group hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Já analiso jogos</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">
                Faço minha análise pré-jogo, mas sinto que faltam ferramentas e dados mais profundos.
              </p>
            </CardContent>
            <CardFooter>
              <a href="#" className="flex items-center text-primary font-medium hover:underline">
                Aqui é para você <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </CardFooter>
          </Card>
          
          <Card className="bg-background border-border flex flex-col group sm:col-span-2 lg:col-span-1 hover:border-primary/40 transition-all">
            <CardHeader>
              <div className="mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Quero validar e escalar</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-muted-foreground">
                Tenho método, quero backtest robusto, bases históricas e otimização estatística.
              </p>
            </CardContent>
            <CardFooter>
              <a href="#" className="flex items-center text-primary font-medium hover:underline">
                Aqui é para você <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}
