
import { ArtigoEditor } from '@/components/artigos/ArtigoEditor'

export default async function CmsNovoPage() {

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Novo Artigo</h1>
        <p className="text-muted-foreground mt-1">Crie um novo artigo ou estudo. Ele será salvo inicialmente como rascunho.</p>
      </div>
      
      <div className="bg-surface border rounded-lg p-6">
        <ArtigoEditor />
      </div>
    </div>
  )
}
