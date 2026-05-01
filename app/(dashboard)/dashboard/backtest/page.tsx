import { EmConstrucao } from "@/components/dashboard/em-construcao"
import { LineChart } from "lucide-react"

export default function BacktestsPage() {
  return (
    <EmConstrucao
      titulo="Backtests"
      descricao="Em breve você terá acesso a uma ferramenta poderosa para validar suas estratégias com dados históricos."
      icone={LineChart}
    />
  )
}
