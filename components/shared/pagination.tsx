import Link from "next/link"
import { Button } from "@/components/ui/button"

// Propriedades para o componente de paginação
interface PaginationProps {
  paginaAtual: number
  totalPaginas: number
  baseUrl: string
  searchParams?: Record<string, string>
}

export function Pagination({
  paginaAtual,
  totalPaginas,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  if (totalPaginas <= 1) return null

  // Helper para gerar a URL mantendo os searchParams atuais
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", pageNumber.toString())
    return `${baseUrl}?${params.toString()}`
  }

  // Gera a lista de páginas a exibir com limite de 5 itens visíveis
  const getPageNumbers = () => {
    const pages = []
    
    if (totalPaginas <= 5) {
      // Menos de 5 páginas, mostra todas
      for (let i = 1; i <= totalPaginas; i++) {
        pages.push(i)
      }
    } else {
      // Mais de 5 páginas, usa elipses
      if (paginaAtual <= 3) {
        // Início
        pages.push(1, 2, 3, 4, '...', totalPaginas)
      } else if (paginaAtual >= totalPaginas - 2) {
        // Fim
        pages.push(1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas)
      } else {
        // Meio
        pages.push(1, '...', paginaAtual - 1, paginaAtual, paginaAtual + 1, '...', totalPaginas)
      }
    }
    
    return pages
  }

  const pages = getPageNumbers()

  return (
    <nav aria-label="Navegação de páginas" className="flex items-center justify-center space-x-2">
      {/* Botão Anterior */}
      <Button
        variant="outline"
        size="sm"
        disabled={paginaAtual <= 1}
        asChild={paginaAtual > 1}
        className={paginaAtual <= 1 ? "pointer-events-none opacity-50" : ""}
      >
        {paginaAtual > 1 ? (
          <Link href={createPageUrl(paginaAtual - 1)}>
            « Anterior
          </Link>
        ) : (
          <span>« Anterior</span>
        )}
      </Button>

      {/* Números de Página */}
      <div className="hidden sm:flex items-center space-x-2">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            )
          }

          const isCurrentPage = page === paginaAtual

          return (
            <Button
              key={`page-${page}`}
              variant={isCurrentPage ? "default" : "ghost"}
              size="sm"
              asChild={!isCurrentPage}
              className={isCurrentPage ? "pointer-events-none" : ""}
            >
              {isCurrentPage ? (
                <span>{page}</span>
              ) : (
                <Link href={createPageUrl(page as number)}>
                  {page}
                </Link>
              )}
            </Button>
          )
        })}
      </div>

      {/* Indicador mobile */}
      <span className="flex sm:hidden text-sm text-muted-foreground">
        {paginaAtual} / {totalPaginas}
      </span>

      {/* Botão Próxima */}
      <Button
        variant="outline"
        size="sm"
        disabled={paginaAtual >= totalPaginas}
        asChild={paginaAtual < totalPaginas}
        className={paginaAtual >= totalPaginas ? "pointer-events-none opacity-50" : ""}
      >
        {paginaAtual < totalPaginas ? (
          <Link href={createPageUrl(paginaAtual + 1)}>
            Próxima »
          </Link>
        ) : (
          <span>Próxima »</span>
        )}
      </Button>
    </nav>
  )
}
