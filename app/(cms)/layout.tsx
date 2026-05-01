import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, PlusCircle, Settings } from 'lucide-react'

export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-surface border-r md:min-h-screen flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-display font-bold text-primary">BDB CMS</h2>
          <p className="text-sm text-muted-foreground mt-1">Olá, {session.user.name}</p>
          <div className="mt-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-full inline-block">
            {session.user.role}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/cms" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-text-secondary hover:text-text-primary transition-colors">
            <FileText size={18} />
            <span>Artigos</span>
          </Link>
          <Link href="/cms/novo" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-text-secondary hover:text-text-primary transition-colors">
            <PlusCircle size={18} />
            <span>Novo Artigo</span>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted text-text-secondary hover:text-text-primary transition-colors">
            <Settings size={18} />
            <span>Ir para Dashboard</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
