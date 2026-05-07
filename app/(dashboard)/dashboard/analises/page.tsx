import { Metadata } from 'next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, HardHat } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Análises Avançadas - BDB',
}

function EmConstrucao({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card border-dashed mt-4">
      <HardHat className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        {description}
      </p>
      <div className="mt-6 px-4 py-2 bg-muted rounded-full text-sm font-medium text-muted-foreground">
        Em desenvolvimento
      </div>
    </div>
  )
}

export default function AnalisesPage() {
  return (
    <div className="space-y-8 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <LineChart className="w-8 h-8 text-primary" />
          Análises Avançadas
        </h1>
        <p className="text-muted-foreground text-lg">
          Ferramentas de análise profunda do mercado e estatísticas
        </p>
      </div>

      <Tabs defaultValue="confrontos" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 mb-4">
          <TabsTrigger value="confrontos">Confrontos</TabsTrigger>
          <TabsTrigger value="mercados">Mercados</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="confrontos" className="outline-none">
          <EmConstrucao 
            title="Análise de Confrontos Diretos" 
            description="Explore o histórico e estatísticas detalhadas entre as duas equipes, identificando padrões H2H."
          />
        </TabsContent>
        
        <TabsContent value="mercados" className="outline-none">
          <EmConstrucao 
            title="Radar de Mercados" 
            description="Acompanhe o movimento das odds e a precificação do mercado em tempo real em comparação à justa."
          />
        </TabsContent>
        
        <TabsContent value="evolucao" className="outline-none">
          <EmConstrucao 
            title="Evolução de Desempenho" 
            description="Gráficos avançados de overperformance e underperformance (xG vs Gols Reais) para times da liga."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
