/**
 * Hard empty all application tables in `public` (keeps schema + `_prisma_migrations`).
 *
 *   node scripts/truncate-all-app-data.js --confirm=TRUNCATE_ALL_APP_DATA
 *
 * Safer than guessing delete order; one TRUNCATE … CASCADE clears FK chains.
 */
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const REQUIRED = 'TRUNCATE_ALL_APP_DATA';

async function main() {
  const confirm =
    process.argv.find((a) => a.startsWith('--confirm='))?.split('=')[1] ||
    process.env.CONFIRM_TRUNCATE;

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }
  if (confirm !== REQUIRED) {
    console.error(`Refusing. Pass --confirm=${REQUIRED}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const rows = await prisma.$queryRaw`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> '_prisma_migrations'
      ORDER BY tablename
    `;
    const names = rows.map((r) => r.tablename);
    if (names.length === 0) {
      console.log('No public tables to truncate.');
      return;
    }

    const quoted = names.map((t) => `"${t.replace(/"/g, '""')}"`).join(', ');
    const sql = `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`;
    console.log('Truncating tables:', names.join(', '));
    await prisma.$executeRawUnsafe(sql);

    const verify = await prisma.$queryRaw`
      SELECT relname AS table, n_live_tup::bigint AS approx_rows
      FROM pg_stat_user_tables
      WHERE schemaname = 'public' AND relname <> '_prisma_migrations'
      ORDER BY relname
    `;
    console.log('\nApprox row counts after truncate (pg_stat may lag slightly):');
    console.table(verify);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
