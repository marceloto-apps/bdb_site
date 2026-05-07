import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY

async function main() {
  const prisma = new PrismaClient()
  
  const TARGET_MATCH_ID = 'mt_894624346'
  
  const res = await fetch(`${BASE_URL}/matches/${TARGET_MATCH_ID}/player-stats`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  })
  
  const json = await res.json()
  
  const keys = new Set<string>()
  if (json.data) {
    json.data.forEach((p: any) => {
      if (p.general) Object.keys(p.general).forEach(k => keys.add('general.'+k))
      if (p.duels) Object.keys(p.duels).forEach(k => keys.add('duels.'+k))
      if (p.passing) Object.keys(p.passing).forEach(k => keys.add('passing.'+k))
      if (p.shooting) Object.keys(p.shooting).forEach(k => keys.add('shooting.'+k))
      if (p.defending) Object.keys(p.defending).forEach(k => keys.add('defending.'+k))
    })
  }
  
  console.log('--- ALL UNIQUE PLAYER STAT KEYS ---')
  console.log(Array.from(keys).sort())
  
  await prisma.$disconnect()
}

main()
