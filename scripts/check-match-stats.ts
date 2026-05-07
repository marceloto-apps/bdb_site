import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const data = await prisma.$queryRaw`SELECT m.id, t1.name AS mandante, t2.name AS visitante, ms.homeXg, ms.awayXg, ms.homePossession, ms.awayPossession FROM MatchStats ms JOIN matches m ON ms.matchId = m.id JOIN teams t1 ON m.homeTeamId = t1.id JOIN teams t2 ON m.awayTeamId = t2.id LIMIT 5`;
  console.table(data);
  await prisma.$disconnect();
}
run();
