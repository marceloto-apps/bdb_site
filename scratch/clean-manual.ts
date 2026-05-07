import { prisma } from '../lib/prisma';

async function main() {
  const manual = await prisma.match.findMany({
    where: { externalId: null }
  });
  console.log(`Manual matches without externalId: ${manual.length}`);
  
  if (manual.length > 0) {
    const res = await prisma.match.deleteMany({
      where: { externalId: null }
    });
    console.log(`Deleted ${res.count} manual matches`);
  }
}

main().finally(() => prisma.$disconnect());
