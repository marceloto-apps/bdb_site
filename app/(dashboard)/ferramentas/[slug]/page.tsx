import { EmConstrucao } from "@/components/dashboard/em-construcao"
import { Wrench } from "lucide-react"

export default function FerramentaPage() {
  return (
    <EmConstrucao
      titulo="Ferramenta"
      descricao="Em breve você poderá utilizar esta ferramenta de análise avançada para impulsionar seus resultados."
      icone={Wrench}
    />
  )
}
