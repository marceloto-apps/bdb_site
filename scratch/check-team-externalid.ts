import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany();
  
  const externalIdCounts: Record<string, number> = {};
  let nullCount = 0;
  
  for (const team of teams) {
    if (team.externalId === null) {
      nullCount++;
    } else {
      externalIdCounts[team.externalId] = (externalIdCounts[team.externalId] || 0) + 1;
    }
  }
  
  const duplicates = Object.entries(externalIdCounts)
    .filter(([_, count]) => count > 1)
    .map(([externalId, count]) => ({ externalId, cnt: count }));
    
  console.log("Null externalIds:", nullCount);
  console.log("Duplicate externalIds:", duplicates);
  
  if (nullCount > 0 || duplicates.length > 0) {
    console.log("ACTION REQUIRED: There are null or duplicate externalIds.");
  } else {
    console.log("SUCCESS: externalId check passed.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
