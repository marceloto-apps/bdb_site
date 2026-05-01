"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Propriedades para o componente de filtro
interface FiltroArtigosProps {
  categorias: string[]
  tags: string[]
  tipos: string[]
  baseUrl: string
  categoriaSelecionada?: string
  tagSelecionada?: string
  tipoSelecionado?: string
}

export function FiltroArtigos({
  categorias,
  tags,
  tipos,
  baseUrl,
  // O valor default "todas" de categoriaSelecionada serve como fallback
  // quando o componente pai não passa o searchParam. O pai deve passar:
  // searchParams.get('categoria') ?? undefined
  categoriaSelecionada = "todas",
  tagSelecionada,
  tipoSelecionado = "todos",
}: FiltroArtigosProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Função auxiliar para formatar os tipos
  const formatarTipo = (tipo: string) =>
    tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase()

  // Função para atualizar a URL com os novos parâmetros de filtro
  const atualizarFiltro = (chave: "categoria" | "tag" | "tipo", valor: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (valor === "todas" || valor === "todos" || valor === "") {
      params.delete(chave)
    } else {
      params.set(chave, valor)
    }

    // Ao mudar o filtro, reseta a paginação para a página 1
    params.delete("page")

    router.push(`${baseUrl}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6 mb-8 p-4 bg-card rounded-lg border border-border">
      
      {/* Linha 1: Selects de Tipo e Categoria */}
      <div className="flex flex-col gap-4 md:flex-row">
        
        {/* Filtro de Tipo */}
        <div className="w-full md:w-48 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Tipo</label>
          <Select
            value={tipoSelecionado}
            onValueChange={(value) => atualizarFiltro("tipo", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tipos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {formatarTipo(tipo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Categoria */}
        <div className="w-full md:w-48 space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Categoria</label>
          <Select
            value={categoriaSelecionada}
            onValueChange={(value) => atualizarFiltro("categoria", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtro de Tags */}
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Tags populares</label>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={!tagSelecionada || tagSelecionada === "todas" ? "default" : "outline"}
            className="cursor-pointer transition-colors"
            onClick={() => atualizarFiltro("tag", "todas")}
          >
            Todas
          </Badge>
          
          {/* Renderiza as tags dinamicamente */}
          {tags.map((tag) => {
            const isSelected = tagSelecionada === tag
            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected ? "" : "hover:bg-primary/10 hover:text-primary"
                )}
                onClick={() => atualizarFiltro("tag", isSelected ? "todas" : tag)}
              >
                {tag}
              </Badge>
            )
          })}
        </div>
      </div>

    </div>
  )
}
