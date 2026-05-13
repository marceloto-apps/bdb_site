import { headers } from 'next/headers'
import { CategoriaListagem } from '@/components/cms/CategoriaListagem'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const host = headers().get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  
  let categorias = []
  
  try {
    const res = await fetch(`${protocol}://${host}/api/categorias`, {
      cache: 'no-store',
      headers: { cookie: headers().get('cookie') || '' }
    })
    
    if (res.ok) {
      const result = await res.json()
      categorias = result.data || []
    }
  } catch (error) {
    console.error('Erro ao buscar categorias', error)
  }

  return (
    <div className="py-6">
      <CategoriaListagem categorias={categorias} />
    </div>
  )
}
