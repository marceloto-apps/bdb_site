import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"

// Propriedades esperadas para renderizar o card do artigo
interface ArtigoCardPublicoProps {
  slug: string
  titulo: string
  resumo: string
  imagemCapa?: string | null
  categoria: string
  publicadoEm: Date
}

export function ArtigoCardPublico({
  slug,
  titulo,
  resumo,
  imagemCapa,
  categoria,
  publicadoEm,
}: ArtigoCardPublicoProps) {
  // Define a rota unificada para todos os artigos
  const url = `/artigos/${slug}`

  // Formatação da data (ex: 30 abr 2026)
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(publicadoEm)

  return (
    <Link
      href={url}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-all hover:border-primary"
      )}
    >
      {/* Imagem de Capa (Aspect Video) */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {imagemCapa ? (
          <Image
            src={imagemCapa}
            alt={titulo}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            {/* Fallback caso não haja imagem de capa */}
            <FileText className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Conteúdo do Card */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge variant="outline">{categoria}</Badge>
          
          <time className="text-xs text-muted-foreground" dateTime={publicadoEm.toISOString()}>
            {dataFormatada}
          </time>
        </div>

        {/* Título e Resumo do Artigo */}
        <h3 className="mb-2 line-clamp-2 text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
          {titulo}
        </h3>
        
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground flex-1">
          {resumo}
        </p>

      </div>
    </Link>
  )
}
