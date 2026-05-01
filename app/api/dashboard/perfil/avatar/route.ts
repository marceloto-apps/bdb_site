import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { cloudinary } from '@/lib/cloudinary'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validação de tipo MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Envie JPG, PNG ou WEBP.' },
        { status: 400 }
      )
    }

    // Validação de tamanho (máximo 2MB)
    const MAX_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 2MB.' },
        { status: 400 }
      )
    }

    // Converte o File para um array buffer e então para buffer para o Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Faz o upload para o Cloudinary via upload_stream (para aceitar o buffer na memória)
    const result = await new Promise<{ secure_url?: string } | undefined>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          public_id: `user_${user.id}`, // Fixo por usuário para sobrescrever sempre o anterior
          overwrite: true,
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face' },
            { fetch_format: 'auto', quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result)
          }
        }
      )
      uploadStream.end(buffer)
    })

    if (!result || !result.secure_url) {
      throw new Error('Falha no retorno do Cloudinary')
    }

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('[AVATAR_UPLOAD]', error)
    return NextResponse.json({ error: 'Erro interno ao realizar upload da imagem' }, { status: 500 })
  }
}
