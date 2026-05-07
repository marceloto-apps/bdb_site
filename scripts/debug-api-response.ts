// scripts/debug-api-response.ts
import { PrismaClient } from '@prisma/client'

const BASE_URL = process.env.THESTATSAPI_BASE_URL || 'https://api.thestatsapi.com/api/football'
const API_KEY = process.env.THESTATSAPI_KEY

async function main() {
  const prisma = new PrismaClient()
  
  const match = await prisma.match.findFirst({
    where: { status: 'FINISHED', externalId: { not: undefined } },
    select: { id: true, externalId: true },
  })
  
  if (!match) {
    console.log('Nenhum match com externalId encontrado.')
    return
  }

  console.log(`Buscando stats de: ${match.externalId}`)
  
  const res = await fetch(`${BASE_URL}/matches/${match.externalId}/stats`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
  })
  
  if (!res.ok) {
    console.log(`Erro da API: ${res.status}`, await res.text())
    return
  }

  const json = await res.json()
  
  // Imprimir o JSON completo formatado
  // console.log(JSON.stringify(json, null, 2))
  
  // Imprimir especificamente a seção overview
  console.log('\n--- OVERVIEW ---')
  console.log(JSON.stringify(json.data?.overview, null, 2))
  
  // Imprimir especificamente possession
  console.log('\n--- POSSESSION ---')
  console.log(JSON.stringify(json.data?.overview?.possession, null, 2))
  
  // Checking other categories for structure reference
  console.log('\n--- FIRST LEVEL CATEGORIES ---')
  console.log(Object.keys(json.data || {}))

  console.log('\n--- XG AND RED CARDS ---');
  console.log('np_expected_goals:', JSON.stringify(json.data?.np_expected_goals));
  console.log('expected_goals (overview):', JSON.stringify(json.data?.overview?.expected_goals));
  
  // Try to find red_cards anywhere in the data
  const findKey = (obj: any, keyName: string, path: string = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj)) {
      if (k.includes(keyName)) {
        console.log(`Found ${keyName} at ${path}.${k} =`, v);
      }
      if (typeof v === 'object') {
        findKey(v, keyName, `${path}.${k}`);
      }
    }
  };
  findKey(json.data, 'red');
  
  await prisma.$disconnect()
}

main()
