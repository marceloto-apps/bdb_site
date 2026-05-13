import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')

  if (!matchId) {
    return NextResponse.json({ error: 'Faltou passar o ?matchId na URL' }, { status: 400 })
  }

  if (!API_KEY) {
    return NextResponse.json({ error: 'THESTATSAPI_KEY não configurada no .env' }, { status: 500 })
  }

  try {
    const res = await fetch(`${BASE_URL}/matches/${matchId}/stats`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Erro na API TheStatsAPI: ${res.status}`, details: await res.text() },
        { status: res.status }
      )
    }

    const json = await res.json()

    // Retorna o JSON completo direto para o navegador
    return NextResponse.json(json.data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao fazer requisição', details: String(error) },
      { status: 500 }
    )
  }
}
