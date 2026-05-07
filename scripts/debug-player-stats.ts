import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY

async function main() {
  const prisma = new PrismaClient()
  
  // Usando o Cruzeiro x Atlético-MG
  const TARGET_MATCH_ID = 'mt_894624346'
  
  console.log(`Buscando player stats de: ${TARGET_MATCH_ID}`)
  
  const res = await fetch(`${BASE_URL}/matches/${TARGET_MATCH_ID}/player-stats`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  })
  
  if (!res.ok) {
    console.log(`Erro da API: ${res.status}`, await res.text())
    return
  }

  const json = await res.json()
  
  // Vamos pegar apenas 1 jogador como exemplo e imprimir a estrutura dele
  if (json.data && json.data.length > 0) {
    console.log(JSON.stringify(json.data[0], null, 2))
  } else {
    console.log("Nenhum dado de jogador retornado.")
  }
  
  await prisma.$disconnect()
}

main()
