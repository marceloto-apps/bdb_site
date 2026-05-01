import { EmConstrucao } from "@/components/dashboard/em-construcao"
import { GraduationCap } from "lucide-react"

export default function CursoPage() {
  return (
    <EmConstrucao
      titulo="Aulas e Cursos"
      descricao="Em breve você terá acesso a um catálogo completo de aulas e materiais didáticos exclusivos."
      icone={GraduationCap}
    />
  )
}
