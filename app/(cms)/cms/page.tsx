
import { ArtigoListagem } from '@/components/artigos/ArtigoListagem'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function CmsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  // Construir a query para a API
  const params = new URLSearchParams()
  if (typeof searchParams.status === 'string') params.set('status', searchParams.status)
  if (typeof searchParams.type === 'string') params.set('type', searchParams.type)
  if (typeof searchParams.page === 'string') params.set('page', searchParams.page)

  const host = headers().get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  let artigos = []
  
  try {
    const res = await fetch(`${protocol}://${host}/api/artigos?${params.toString()}`, {
      cache: 'no-store',
      headers: { cookie: headers().get('cookie') || '' }
    })
    
    if (res.ok) {
      const result = await res.json()
      artigos = result.data || []
    }
  } catch (error) {
    console.error('Erro ao buscar artigos', error)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Conteúdos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os artigos e análises da plataforma.</p>
        </div>
      </div>
      
      <ArtigoListagem artigos={artigos} />
    </div>
  )
}
