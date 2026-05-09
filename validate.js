const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- odds_movements ---');
  console.log(await prisma.$queryRaw`SHOW TABLES LIKE 'odds_movements'`);

  console.log('\n--- ingest_jobs ---');
  console.log(await prisma.$queryRaw`SHOW TABLES LIKE 'ingest_jobs'`);

  console.log('\n--- Season columns ---');
  console.log(await prisma.$queryRaw`SHOW COLUMNS FROM \`Season\` WHERE Field IN ('lastSyncedAt', 'syncStatus')`);

  console.log('\n--- Migrations ---');
  console.log(await prisma.$queryRaw`SELECT * FROM \`_prisma_migrations\` WHERE migration_name = '20260507_fase_s_ingest_infrastructure'`);

  console.log('\n--- Total tables ---');
  const count = await prisma.$queryRaw`SELECT COUNT(*) AS total_tabelas FROM information_schema.tables WHERE table_schema = 'bigda077_site'`;
  // serialize BigInts
  console.log(JSON.stringify(count, (k, v) => typeof v === 'bigint' ? v.toString() : v));
}

main().finally(() => prisma.$disconnect());
