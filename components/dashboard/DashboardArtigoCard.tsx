import Image from 'next/image'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DashboardArtigoCardProps {
  artigo: {
    id: string
    slug: string
    title: string
    thumbnail: string | null
    type: string
    category: { name: string; slug: string } | null
  }
  // Data contextual: "Lido em..." ou "Favoritado em..."
  dateLabel: string
  date: Date
  // Ação opcional no canto (ex: botão remover favorito)
  action?: React.ReactNode
  variant?: 'default' | 'compact'
}

export function DashboardArtigoCard({
  artigo,
  dateLabel,
  date,
  action,
  variant = 'default',
}: DashboardArtigoCardProps) {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))

  const isCompact = variant === 'compact'

  return (
    <div className={cn(
      "relative group rounded-lg border border-border bg-surface hover:border-primary/50 transition-colors overflow-hidden flex",
      isCompact ? "p-3" : "p-0" // Se default, o <Link> preenche e não tem gap visual. O padding original é no Link/div interna.
    )}>
      <Link href={`/artigos/${artigo.slug}`} className={cn(
        "flex flex-1 items-center",
        isCompact ? "gap-3" : ""
      )}>
        {/* Thumbnail */}
        <div className={cn(
          "relative shrink-0 bg-muted flex items-center justify-center",
          isCompact ? "w-16 h-16 rounded-md overflow-hidden" : "w-24 h-24 md:w-32 md:h-32"
        )}>
          {artigo.thumbnail ? (
            <Image
              src={artigo.thumbnail}
              alt={artigo.title}
              fill
              className="object-cover"
              sizes={isCompact ? "64px" : "(max-width: 768px) 96px, 128px"}
            />
          ) : (
            <FileText className={cn("text-muted-foreground", isCompact ? "w-6 h-6" : "w-8 h-8")} />
          )}
        </div>

        {/* Content */}
        <div className={cn("flex-1 min-w-0", isCompact ? "" : "p-3 md:p-4")}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={
                artigo.type === 'ESTUDO' 
                  ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20'
                  : 'bg-data-blue/15 text-data-blue border-data-blue/30 hover:bg-data-blue/20'
              }
            >
              {artigo.type}
            </Badge>
            {!isCompact && artigo.category && (
              <span className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-[150px]">
                {artigo.category.name}
              </span>
            )}
          </div>
          
          <h3 className={cn(
            "font-display font-bold text-foreground mb-2 pr-8",
            isCompact ? "text-base line-clamp-1" : "text-base md:text-lg line-clamp-2"
          )}>
            {artigo.title}
          </h3>
          
          <p className={cn(
            "text-muted-foreground mt-auto",
            isCompact ? "text-xs" : "text-xs"
          )}>
            {dateLabel} {formattedDate}
          </p>
        </div>
      </Link>

      {/* Action (fora do <Link> para evitar propagação) */}
      {!isCompact && action && (
        <div className="absolute top-2 right-2">
          {action}
        </div>
      )}
    </div>
  )
}
