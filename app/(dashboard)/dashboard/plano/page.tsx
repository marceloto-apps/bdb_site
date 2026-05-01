import { EmConstrucao } from "@/components/dashboard/em-construcao"
import { CreditCard } from "lucide-react"

export default function PlanoPage() {
  return (
    <EmConstrucao
      titulo="Meu Plano"
      descricao="Em breve você poderá gerenciar sua assinatura e métodos de pagamento por aqui."
      icone={CreditCard}
    />
  )
}
