'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dynamic from 'next/dynamic'
import { criarArtigoSchema, atualizarArtigoSchema } from '@/lib/validations/artigos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { TagInput } from './TagInput'
import { ImageUpload } from '@/components/cms/ImageUpload'

function getOptimizedCloudinaryUrl(url: string, transformations: string) {
  if (!url.includes('/upload/')) return url;
  const parts = url.split('/upload/');
  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

type FormData = z.infer<typeof criarArtigoSchema>

interface ArtigoEditorProps {
  artigo?: any // Se passado, é modo edição
  userRole: string
}

export function ArtigoEditor({ artigo, userRole }: ArtigoEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(false)

  const isEditMode = !!artigo

  const form = useForm<FormData>({
    resolver: zodResolver(isEditMode ? atualizarArtigoSchema : criarArtigoSchema) as any,
    defaultValues: {
      title: artigo?.title || '',
      slug: artigo?.slug || '',
      type: artigo?.type || 'ESTUDO',
      excerpt: artigo?.excerpt || '',
      content: artigo?.content || '',
      thumbnail: artigo?.thumbnail || '',
      categoryId: artigo?.categoryId || undefined,
      tags: artigo?.tags?.map((t: any) => t.tag.name) || [],
    }
  })

  useEffect(() => {
    fetch('/api/categorias')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setCategorias(data.data)
        }
      })
      .catch(console.error)
  }, [])

  async function onSubmit(data: any) {
    setLoading(true)
    try {
      const url = isEditMode ? `/api/artigos/${artigo.id}` : '/api/artigos'
      const method = isEditMode ? 'PATCH' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await res.json()

      if (!res.ok) {
        if (result.error === 'VALIDATION_ERROR') {
          // Mostrar o primeiro erro de campo no toast
          const field = Object.keys(result.fields)[1] // 0 is _errors
          const errorMsg = result.fields[field]?._errors?.[0] || 'Erro de validação'
          toast({ variant: 'destructive', title: 'Erro de validação', description: `${field}: ${errorMsg}` })
        } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Erro interno' })
        }
        return
      }

      toast({
        title: 'Sucesso',
        description: isEditMode ? 'Artigo atualizado.' : 'Artigo criado como rascunho.',
      })
      
      if (!isEditMode) {
        router.push(`/cms/${result.data.id}`)
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao salvar o artigo.' })
    } finally {
      setLoading(false)
    }
  }

  const handleBodyImageUpload = (url: string) => {
    const optimizedUrl = getOptimizedCloudinaryUrl(url, 'w_800,q_auto,f_auto');
    const imageMarkdown = `\n![Imagem](${optimizedUrl})\n`;
    
    const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = form.getValues('content') || '';
      const newContent = currentContent.substring(0, start) + imageMarkdown + currentContent.substring(end);
      form.setValue('content', newContent, { shouldValidate: true });
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
      }, 0);
    } else {
      const currentContent = form.getValues('content') || '';
      form.setValue('content', currentContent + imageMarkdown, { shouldValidate: true });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...form.register('title')} placeholder="Digite o título do artigo" />
          {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (Auto-gerado se vazio)</Label>
          <Input id="slug" {...form.register('slug')} placeholder="ex: meu-artigo-novo" />
          {form.formState.errors.slug && <p className="text-red-500 text-sm">{form.formState.errors.slug.message}</p>}
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTUDO">Estudo</SelectItem>
                  <SelectItem value="ANALISE">Análise</SelectItem>
                  <SelectItem value="ARTIGO">Artigo</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.type && <p className="text-red-500 text-sm">{form.formState.errors.type.message}</p>}
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <Controller
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="excerpt">Resumo (Excerpt)</Label>
          <Textarea id="excerpt" {...form.register('excerpt')} placeholder="Breve resumo para SEO e listagem" className="h-20" />
          {form.formState.errors.excerpt && <p className="text-red-500 text-sm">{form.formState.errors.excerpt.message}</p>}
        </div>

        {/* Thumbnail */}
        <div className="space-y-2 md:col-span-2">
          <Label>Imagem de Capa (Thumbnail)</Label>
          <Controller
            control={form.control}
            name="thumbnail"
            render={({ field }) => (
              <ImageUpload 
                value={field.value || ''} 
                onChange={(url) => {
                  const optimized = getOptimizedCloudinaryUrl(url, 'w_1200,h_630,c_fill,q_auto,f_auto');
                  field.onChange(optimized);
                }}
                onRemove={() => field.onChange('')}
                buttonText="Upload de Thumbnail"
              />
            )}
          />
          {form.formState.errors.thumbnail && <p className="text-red-500 text-sm">{form.formState.errors.thumbnail.message}</p>}
        </div>

        {/* Tags */}
        <div className="space-y-2 md:col-span-2">
          <Label>Tags</Label>
          <Controller
            control={form.control}
            name="tags"
            render={({ field }) => (
              <TagInput value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {/* Content (Markdown) */}
      <div className="space-y-2" data-color-mode="dark">
        <div className="flex items-center justify-between mb-2">
          <Label>Conteúdo (Markdown)</Label>
          <div className="w-auto">
            <ImageUpload 
              value="" 
              onChange={handleBodyImageUpload} 
              buttonText="Inserir imagem no corpo"
            />
          </div>
        </div>
        <Controller
          control={form.control}
          name="content"
          render={({ field }) => (
            <MDEditor
              value={field.value}
              onChange={field.onChange}
              height={500}
              preview="live"
              className="mt-2"
            />
          )}
        />
        {form.formState.errors.content && <p className="text-red-500 text-sm">{form.formState.errors.content.message}</p>}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
