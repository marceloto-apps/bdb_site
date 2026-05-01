import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cloudinary } from '@/lib/cloudinary'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // TODO para o frontend (Feature 6):
    // Como o Cloudinary não permite restringir formato/tamanho no momento da assinatura,
    // o cliente DEVE validar antes de subir:
    // - Formatos: image/jpeg, image/png, image/webp
    // - Tamanho máximo: 5 MB

    const timestamp = Math.round(Date.now() / 1000)
    const folder = 'bigdatabet/avatars'
    const transformation = 'c_fill,g_face,h_400,w_400,q_auto,f_auto'

    const paramsToSign = {
      timestamp,
      folder,
      transformation,
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ??
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    return NextResponse.json({
      data: {
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName,
        folder,
        transformation,
      },
      message: 'Assinatura gerada com sucesso'
    })
  } catch (error) {
    console.error('[POST /api/upload/signature]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
