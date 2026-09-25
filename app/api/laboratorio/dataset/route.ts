/**
 * GET /api/laboratorio/dataset                → { versao, geradoEm, totalLinhas, catalogoVersao }
 * GET /api/laboratorio/dataset?chaves=a,b,c   → { urls: { a: <url assinada>, ... }, expiraEm }
 *
 * Acesso: usuário autenticado com plano do backtest (VIP_PRO ou legado). O navegador recebe URLs
 * assinadas de 15 min para os grupos de colunas que a regra referencia; a chave do R2 fica no servidor.
 */
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasBacktestAccess } from '@/lib/auth/check-access'
import { assinarUrl, chaveValida, lerLatest, r2Configurado } from '@/lib/laboratorio/data/r2'

export const dynamic = 'force-dynamic'

const MAX_CHAVES = 400
const TTL_SEGUNDOS = 900

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  if (!(await hasBacktestAccess(session.user.id))) return NextResponse.json({ error: 'UNAUTHORIZED_PLAN' }, { status: 403 })
  if (!r2Configurado()) return NextResponse.json({ error: 'DATASET_INDISPONIVEL' }, { status: 503 })

  const chavesParam = new URL(req.url).searchParams.get('chaves')
  try {
    if (!chavesParam) return NextResponse.json(await lerLatest(), { headers: { 'Cache-Control': 'private, max-age=60' } })

    const chaves = chavesParam.split(',').map((c) => c.trim()).filter(Boolean)
    if (chaves.length === 0 || chaves.length > MAX_CHAVES) return NextResponse.json({ error: 'CHAVES_INVALIDAS' }, { status: 400 })
    const invalida = chaves.find((c) => !chaveValida(c))
    if (invalida) return NextResponse.json({ error: 'CHAVE_INVALIDA', chave: invalida }, { status: 400 })

    const urls: Record<string, string> = {}
    await Promise.all(chaves.map(async (c) => { urls[c] = await assinarUrl(c, TTL_SEGUNDOS) }))
    return NextResponse.json({ urls, expiraEm: new Date(Date.now() + TTL_SEGUNDOS * 1000).toISOString() }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (e) {
    console.error('[laboratorio/dataset]', e)
    return NextResponse.json({ error: 'ERRO_DATASET' }, { status: 500 })
  }
}
