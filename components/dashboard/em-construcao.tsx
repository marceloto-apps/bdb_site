import { Construction, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmConstrucaoProps {
  titulo?: string
  descricao?: string
  icone?: LucideIcon
}

export function EmConstrucao({
  titulo = 'Em construção',
  descricao = 'Esta funcionalidade chegará em breve para deixar tudo que temos aqui ainda melhor.',
  icone: Icon = Construction,
}: EmConstrucaoProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-500">
      <div className="bg-muted p-4 rounded-full mb-6">
        <Icon className="w-16 h-16 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-3">{titulo}</h2>
      <p className="text-muted-foreground max-w-md mb-8">{descricao}</p>
      <Button variant="outline" asChild>
        <Link href="/dashboard">Voltar ao Dashboard</Link>
      </Button>
    </div>
  )
}
