import { v2 as cloudinary } from 'cloudinary'

// Cloud name pode vir tanto da var server-only quanto da pública
// (a pública já existe no projeto e é o mesmo valor — evita duplicação no .env)
const cloudName =
  process.env.CLOUDINARY_CLOUD_NAME ??
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

if (!cloudName) {
  throw new Error('CLOUDINARY_CLOUD_NAME não configurado')
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }
