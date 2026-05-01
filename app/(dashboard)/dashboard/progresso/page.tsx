import { EmConstrucao } from "@/components/dashboard/em-construcao"
import { Trophy } from "lucide-react"

export default function ProgressoPage() {
  return (
    <EmConstrucao
      titulo="Meu Progresso"
      descricao="Em breve você poderá acompanhar aqui a sua evolução nos cursos e metas de estudo."
      icone={Trophy}
    />
  )
}
