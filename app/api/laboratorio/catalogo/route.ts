/**
 * GET /api/laboratorio/catalogo[?versao=X] → { catalogo, funcoes, manifest, resumo }
 * Catálogo de campos (para autocomplete/validação no Worker), funções virtuais, manifesto da versão
 * (o Worker precisa dos chunks/hashes) e resumo de competições×temporadas para a UI.
 */
import { NextResponse } from 'next/server'
import { ehResposta, erroInterno, usuarioDoLaboratorio } from '@/lib/laboratorio/api/auth'
import { lerManifest, resumoManifest } from '@/lib/laboratorio/data/servidor'
import { r2Configurado } from '@/lib/laboratorio/data/r2'
import { CATALOGO_VERSAO, FUNCOES_VIRTUAIS, gerarCatalogo } from '@/lib/laboratorio/schema/catalogo'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const u = await usuarioDoLaboratorio()
  if (ehResposta(u)) return u
  if (!r2Configurado()) return NextResponse.json({ error: 'DATASET_INDISPONIVEL' }, { status: 503 })
  try {
    const versao = new URL(req.url).searchParams.get('versao') ?? undefined
    if (versao && !/^[0-9]{8}-[0-9]{4}$/.test(versao)) return NextResponse.json({ error: 'VERSAO_INVALIDA' }, { status: 400 })
    const manifest = await lerManifest(versao)
    const catalogo = { versao: CATALOGO_VERSAO, campos: gerarCatalogo().map((c) => ({ key: c.key, label: c.label, tipo: c.tipo, bloco: c.bloco, descricao: c.descricao, fontes: c.fontes, cobertura: c.cobertura, virtual: c.virtual })) }
    return NextResponse.json({ catalogo, funcoes: FUNCOES_VIRTUAIS, manifest, resumo: resumoManifest(manifest) }, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch (e) { return erroInterno('catalogo', e) }
}
