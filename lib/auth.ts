import { NextRequest } from 'next/server'

// Proteção temporária para rotas admin via API key
// TODO: substituir por NextAuth.js quando implementado

export async function verificarAdmin(req: NextRequest): Promise<boolean> {
  const apiKey = req.headers.get('x-admin-key')
  return apiKey === process.env.ADMIN_API_KEY
}
