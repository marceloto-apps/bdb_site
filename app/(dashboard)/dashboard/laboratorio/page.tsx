// app/(dashboard)/dashboard/laboratorio/page.tsx — Laboratório de Estratégias (Backtest Livre, D6)
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasBacktestAccess } from '@/lib/auth/check-access'
import { r2Configurado } from '@/lib/laboratorio/data/r2'
import { UpgradeBacktest } from '../backtest/UpgradeBacktest'
import { LaboratorioClient } from '@/components/laboratorio/LaboratorioClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Laboratório de Estratégias - BDB' }
export const dynamic = 'force-dynamic'

export default async function LaboratorioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!(await hasBacktestAccess(session.user.id))) return <UpgradeBacktest />
  return <LaboratorioClient datasetDisponivel={r2Configurado()} />
}
