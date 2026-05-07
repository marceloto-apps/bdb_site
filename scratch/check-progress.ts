import { prisma } from '../lib/prisma';

async function main() {
  const matches = await prisma.match.count();
  const odds = await prisma.match.count({
    where: { pinHome: { not: null } }
  });
  
  const currentMonth = new Date().toISOString().slice(0, 7)
  const logs = await prisma.apiQuotaLog.aggregate({
    where: { month: currentMonth },
    _sum: { requestCount: true }
  });
  
  console.log(`Total Matches: ${matches}`);
  console.log(`Matches with Odds: ${odds}`);
  console.log(`Quota Used This Month: ${logs._sum.requestCount}`);
}

main();
