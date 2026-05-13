const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const comps = await prisma.competition.findMany({ select: { name: true, slug: true } });
  console.log(comps);
}
main().finally(() => prisma.$disconnect());
