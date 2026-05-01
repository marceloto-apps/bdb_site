import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './StatusBadge'

interface ArtigoCardProps {
  artigo: {
    id: string
    title: string
    type: string
    status: 'RASCUNHO' | 'REVISAO' | 'PUBLICADO'
    author: { name: string | null }
    updatedAt: Date
  }
}

export function ArtigoCard({ artigo }: ArtigoCardProps) {
  return (
    <Card className="flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg line-clamp-2 leading-tight">
            <Link href={`/cms/${artigo.id}`} className="hover:text-primary transition-colors">
              {artigo.title}
            </Link>
          </CardTitle>
          <StatusBadge status={artigo.status} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">
            {artigo.type === 'ESTUDO' ? 'Estudo' : artigo.type === 'ANALISE' ? 'Análise' : 'Artigo'}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground mt-4 space-y-1">
          <p>Autor: {artigo.author.name || 'Desconhecido'}</p>
          <p>Atualizado em: {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(artigo.updatedAt)).replace(',', ' às')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
