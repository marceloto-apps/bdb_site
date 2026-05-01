import { auth } from '@/auth'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArtigoEditor } from '@/components/artigos/ArtigoEditor'
import { StatusActions } from '@/components/artigos/StatusActions'
import { StatusBadge } from '@/components/artigos/StatusBadge'

export const dynamic = 'force-dynamic'

export default async function CmsEditarPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userRole = session?.user?.role as string

  const host = headers().get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

  let artigo = null

  try {
    const res = await fetch(`${protocol}://${host}/api/artigos/${params.id}`, {
      cache: 'no-store',
      headers: { cookie: headers().get('cookie') || '' }
    })
    
    if (res.ok) {
      const result = await res.json()
      artigo = result.data
    } else {
      notFound()
    }
  } catch (error) {
    console.error('Erro ao buscar artigo', error)
    notFound()
  }

  if (!artigo) notFound()

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold">Editar Artigo</h1>
            <StatusBadge status={artigo.status} />
          </div>
          <p className="text-muted-foreground">Última atualização: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(artigo.updatedAt)).replace(',', ' às')}</p>
        </div>
        
        <StatusActions artigo={artigo} userRole={userRole} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface border rounded-lg p-6">
          <ArtigoEditor artigo={artigo} userRole={userRole} />
        </div>

        <div className="space-y-6">
          <div className="bg-surface border rounded-lg p-6">
            <h3 className="font-bold mb-4">Informações</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Autor</span>
                <span>{artigo.author.name}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{new Intl.DateTimeFormat('pt-BR').format(new Date(artigo.createdAt))}</span>
              </li>
              {artigo.publishedAt && (
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Publicado</span>
                  <span>{new Intl.DateTimeFormat('pt-BR').format(new Date(artigo.publishedAt))}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="bg-surface border rounded-lg p-6">
            <h3 className="font-bold mb-4">Histórico de Revisões</h3>
            {artigo.revisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma revisão registrada.</p>
            ) : (
              <div className="space-y-4">
                {artigo.revisions.map((rev: any) => (
                  <div key={rev.id} className="text-sm border-l-2 border-primary/30 pl-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{rev.editor.name}</span>
                      <span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(rev.createdAt))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {rev.fromStatus} → {rev.toStatus}
                    </div>
                    {rev.note && (
                      <div className="bg-muted p-2 rounded mt-1 text-xs italic">
                        "{rev.note}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
