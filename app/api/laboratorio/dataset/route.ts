/**
 * GET /api/laboratorio/dataset                → { versao, geradoEm, totalLinhas, catalogoVersao }
 * GET /api/laboratorio/dataset?chaves=a,b,c   → { urls: { a: <url assinada>, ... }, expiraEm }
 * POST /api/laboratorio/dataset { chaves: [...] } → idem, para lotes grandes (até 1000 chaves; o Worker
 *                                                 assina todas as chaves de uma carga em poucas chamadas)
 *
 * Acesso: usuário autenticado com plano do backtest (VIP_PRO ou legado). O navegador recebe URLs
 * assinadas de 15 min para os grupos de colunas que a regra referencia; a chave do R2 fica no servidor.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasBacktestAccess } from '@/lib/auth/check-access'
import { assinarUrl, chaveValida, lerLatest, r2Configurado } from '@/lib/laboratorio/data/r2'

export const dynamic = 'force-dynamic'

const MAX_CHAVES_GET = 400
const MAX_CHAVES_POST = 1000
const TTL_SEGUNDOS = 900

async function gate(): Promise<NextResponse | null> {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (!(await hasBacktestAccess(session.user.id))) return NextResponse.json({ error: 'UNAUTHORIZED_PLAN' }, { status: 403 })
  if (!r2Configurado()) return NextResponse.json({ error: 'DATASET_INDISPONIVEL' }, { status: 503 })
  return null
}

async function assinarLote(chaves: string[], max: number): Promise<NextResponse> {
  if (chaves.length === 0 || chaves.length > max) return NextResponse.json({ error: 'CHAVES_INVALIDAS' }, { status: 400 })
  const invalida = chaves.find((c) => !chaveValida(c))
  if (invalida) return NextResponse.json({ error: 'CHAVE_INVALIDA', chave: invalida }, { status: 400 })
  const urls: Record<string, string> = {}
  await Promise.all(chaves.map(async (c) => { urls[c] = await assinarUrl(c, TTL_SEGUNDOS) }))
  return NextResponse.json({ urls, expiraEm: new Date(Date.now() + TTL_SEGUNDOS * 1000).toISOString() }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function GET(req: Request) {
  const bloqueio = await gate(); if (bloqueio) return bloqueio
  const chavesParam = new URL(req.url).searchParams.get('chaves')
  try {
    if (!chavesParam) return NextResponse.json(await lerLatest(), { headers: { 'Cache-Control': 'private, max-age=60' } })
    return await assinarLote(chavesParam.split(',').map((c) => c.trim()).filter(Boolean), MAX_CHAVES_GET)
  } catch (e) {
    console.error('[laboratorio/dataset]', e)
    return NextResponse.json({ error: 'ERRO_DATASET' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const bloqueio = await gate(); if (bloqueio) return bloqueio
  try {
    const body = (await req.json().catch(() => null)) as { chaves?: unknown } | null
    const chaves = Array.isArray(body?.chaves) ? body.chaves.filter((c): c is string => typeof c === 'string').map((c) => c.trim()).filter(Boolean) : []
    return await assinarLote(Array.from(new Set(chaves)), MAX_CHAVES_POST)
  } catch (e) {
    console.error('[laboratorio/dataset]', e)
    return NextResponse.json({ error: 'ERRO_DATASET' }, { status: 500 })
  }
}
