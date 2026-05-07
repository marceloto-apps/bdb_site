import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { QuotaPanel } from '@/components/admin/QuotaPanel'
import { Gauge } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Quota API-Football - Admin',
}

export default async function AdminQuotaPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Gauge className="w-8 h-8 text-primary" />
          Quota de API Externa
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitore o consumo diário da API-Football.
        </p>
      </div>

      <div className="max-w-3xl">
        <QuotaPanel />
      </div>
      
      {/* Aqui viria o histórico de uso (últimos 30 dias) num MVP+ */}
    </div>
  )
}
