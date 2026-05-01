'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArtigoCard } from './ArtigoCard'

interface ArtigoListagemProps {
  artigos: any[]
  userRole: string
}

export function ArtigoListagem({ artigos, userRole }: ArtigoListagemProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = searchParams.get('status') || 'ALL'
  const currentType = searchParams.get('type') || 'ALL'

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'ALL') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/cms?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={currentStatus} onValueChange={(v) => updateFilter('status', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="RASCUNHO">Rascunho</SelectItem>
            <SelectItem value="REVISAO">Em Revisão</SelectItem>
            <SelectItem value="PUBLICADO">Publicado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentType} onValueChange={(v) => updateFilter('type', v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os tipos</SelectItem>
            <SelectItem value="ESTUDO">Estudo</SelectItem>
            <SelectItem value="ANALISE">Análise</SelectItem>
            <SelectItem value="ARTIGO">Artigo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {artigos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum artigo encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {artigos.map(artigo => (
            <ArtigoCard key={artigo.id} artigo={artigo} />
          ))}
        </div>
      )}
    </div>
  )
}
