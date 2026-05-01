'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { atualizarPerfilSchema, type AtualizarPerfilInput } from '@/lib/schemas/perfil'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Camera, Loader2 } from 'lucide-react'

interface FormDadosPessoaisProps {
  usuario: {
    name: string | null
    email: string | null
    image: string | null
  }
}

export function FormDadosPessoais({ usuario }: FormDadosPessoaisProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(usuario.image)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<AtualizarPerfilInput>({
    resolver: zodResolver(atualizarPerfilSchema),
    defaultValues: {
      name: usuario.name || '',
      image: usuario.image || undefined, // Apenas para inicializar o schema, o valor será gerenciado separadamente
    }
  })

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação client-side
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return toast({ variant: 'destructive', description: 'Envie JPG, PNG ou WEBP.' })
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast({ variant: 'destructive', description: 'A imagem deve ter no máximo 2MB.' })
    }

    // Preview imediato
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      // 1. Faz upload para o Cloudinary
      const res = await fetch('/api/dashboard/perfil/avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha no upload')

      const finalUrl = data.url
      setPreviewImage(finalUrl)

      // 2. Salva o novo image URL no banco imediatamente (Auto-save)
      const saveRes = await fetch('/api/dashboard/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: usuario.name || '', image: finalUrl }), // Envia o nome atual e a nova foto
      })

      if (!saveRes.ok) {
        const errorData = await saveRes.json()
        throw new Error(errorData.error || 'Erro ao persistir a foto')
      }

      toast({ description: 'Foto de perfil atualizada com sucesso.' })
      
      // Revalida dados do Server para atualizar sidebar etc.
      startTransition(() => {
        router.refresh()
      })

    } catch (error) {
      console.error(error)
      if (error instanceof Error) {
        toast({ variant: 'destructive', description: error.message })
      } else {
        toast({ variant: 'destructive', description: 'Erro inesperado.' })
      }
      setPreviewImage(usuario.image) // Reverte o preview em caso de erro
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: AtualizarPerfilInput) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/dashboard/perfil', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name, image: previewImage }), // Mantém a imagem do preview (ou auto-salva)
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Erro ao atualizar')

        toast({ description: 'Nome atualizado com sucesso.' })
        
        // Reseta o estado isDirty (baseado no novo form state)
        reset({ name: result.user.name, image: result.user.image })

        router.refresh()
      } catch (error) {
        if (error instanceof Error) {
          toast({ variant: 'destructive', description: error.message })
        } else {
          toast({ variant: 'destructive', description: 'Erro inesperado.' })
        }
      }
    })
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 flex flex-col md:flex-row gap-8">
      {/* Coluna da Imagem */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <Avatar className="h-24 w-24 border border-border">
            <AvatarImage src={previewImage || undefined} alt={usuario.name || 'Avatar'} className="object-cover" />
            <AvatarFallback className="text-2xl">{usuario.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          
          {isUploading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/jpeg, image/png, image/webp" 
          onChange={handleImageChange} 
        />
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          className="w-full gap-2" 
          disabled={isUploading || isPending}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="w-4 h-4" />
          Trocar foto
        </Button>
        <span className="text-xs text-muted-foreground text-center px-2">
          As alterações na foto são salvas automaticamente.
        </span>
      </div>

      {/* Coluna do Form (Nome/Email) */}
      <div className="flex-1">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email" 
              value={usuario.email || ''} 
              disabled 
              className="bg-muted/50 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input 
              id="name" 
              {...register('name')} 
              placeholder="Seu nome" 
              disabled={isPending}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <Button 
            type="submit" 
            disabled={!isDirty || isPending || isUploading}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </form>
      </div>
    </div>
  )
}
