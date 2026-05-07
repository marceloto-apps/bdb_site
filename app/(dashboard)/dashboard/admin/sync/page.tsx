import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SyncPanel } from '@/components/admin/SyncPanel'
import { QuotaPanel } from '@/components/admin/QuotaPanel'
import { Database } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sincronização de Dados - Admin',
}

export default async function AdminSyncPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const activeSeasons = await prisma.season.findMany({
    where: { isCurrent: true },
    include: { competition: { select: { name: true } } }
  })

  const seasonsData = activeSeasons.map(s => ({
    id: s.id,
    year: s.year,
    competitionName: s.competition.name
  }))

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Database className="w-8 h-8 text-primary" />
          Administração de Dados
        </h1>
        <p className="text-muted-foreground text-lg">
          Gerencie a sincronização de partidas e controle de quotas da API externa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SyncPanel seasons={seasonsData} />
        </div>
        <div className="lg:col-span-1">
          <QuotaPanel />
        </div>
      </div>
    </div>
  )
}
