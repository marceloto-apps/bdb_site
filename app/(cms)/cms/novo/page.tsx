import { auth } from '@/auth'
import { ArtigoEditor } from '@/components/artigos/ArtigoEditor'

export default async function CmsNovoPage() {
  const session = await auth()
  const userRole = session?.user?.role as string

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Novo Artigo</h1>
        <p className="text-muted-foreground mt-1">Crie um novo artigo ou estudo. Ele será salvo inicialmente como rascunho.</p>
      </div>
      
      <div className="bg-surface border rounded-lg p-6">
        <ArtigoEditor userRole={userRole} />
      </div>
    </div>
  )
}
