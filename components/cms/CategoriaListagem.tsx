"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CategoriaDialog } from "./CategoriaDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Categoria {
  id: string
  name: string
  slug: string
  _count?: {
    articles: number
  }
}

interface CategoriaListagemProps {
  categorias: Categoria[]
}

export function CategoriaListagem({ categorias }: CategoriaListagemProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<Categoria | null>(null)

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [categoriaParaDeletar, setCategoriaParaDeletar] = useState<Categoria | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = (categoria: Categoria) => {
    setCategoriaParaEditar(categoria)
    setDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoriaParaDeletar) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/categorias/${categoriaParaDeletar.id}`, {
        method: "DELETE",
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao deletar categoria")
      }

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      })
      
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Atenção",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteAlertOpen(false)
      setCategoriaParaDeletar(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Categorias</h1>
          <p className="text-muted-foreground mt-1">Gerencie as categorias dos artigos da plataforma.</p>
        </div>
        <Button onClick={() => {
          setCategoriaParaEditar(null)
          setDialogOpen(true)
        }}>
          Nova Categoria
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Artigos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  Nenhuma categoria cadastrada.
                </TableCell>
              </TableRow>
            ) : (
              categorias.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{cat._count?.articles || 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(cat)}
                      title="Editar Categoria"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setCategoriaParaDeletar(cat)
                        setDeleteAlertOpen(true)
                      }}
                      title="Excluir Categoria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoriaDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setCategoriaParaEditar(null)
        }}
        categoria={categoriaParaEditar}
        onSuccess={() => {
          router.refresh()
        }}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir a categoria <strong>{categoriaParaDeletar?.name}</strong>. Esta ação não pode ser desfeita.
              <br /><br />
              Se houver artigos vinculados a esta categoria, a exclusão será bloqueada pelo sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
