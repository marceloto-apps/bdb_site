import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cloudinary } from '@/lib/cloudinary'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { paramsToSign } = body

    if (!paramsToSign) {
      return NextResponse.json({ error: 'Faltam os parâmetros' }, { status: 400 })
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )

    return NextResponse.json({ signature })
  } catch (error) {
    console.error('[POST /api/upload/signature]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
