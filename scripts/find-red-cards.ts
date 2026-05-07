import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY

async function main() {
  const prisma = new PrismaClient()
  
  const matches = await prisma.match.findMany({
    where: { status: 'FINISHED', externalId: { not: undefined } },
    select: { externalId: true },
    take: 20
  })
  
  const allOverviewKeys = new Set<string>()
  
  for (const m of matches) {
    const res = await fetch(`${BASE_URL}/matches/${m.externalId}/stats`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    })
    
    if (!res.ok) continue;
    
    const json = await res.json()
    if (json.data && json.data.overview) {
      Object.keys(json.data.overview).forEach(k => allOverviewKeys.add(k))
    }
    
    // Also log if any red_cards appear anywhere
    const findRed = (obj: any, path: string = '') => {
        if (!obj || typeof obj !== 'object') return;
        for (const [k, v] of Object.entries(obj)) {
          if (k.toLowerCase().includes('red')) {
            console.log(`Found RED at ${path}.${k} for match ${m.externalId}`);
          }
          if (typeof v === 'object') {
            findRed(v, `${path}.${k}`);
          }
        }
      };
      findRed(json.data);
  }

  console.log('--- ALL UNIQUE OVERVIEW KEYS IN 20 MATCHES ---')
  console.log(Array.from(allOverviewKeys))
  
  await prisma.$disconnect()
}

main()
