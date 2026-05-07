import { syncLeague } from '../lib/ingest/sync-engine';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Starting full sync...');
  try {
    const result = await syncLeague({
      leagueSlug: 'brasileirao-serie-a',
      competitionId: 'comp_4795',
      mode: 'full',
      includeOdds: true,
      includeFuture: false
    });
    console.log('Sync Result:', result);
  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
