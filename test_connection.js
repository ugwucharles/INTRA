const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  console.log(`Connecting to: ${connectionString.replace(/:([^:@]+)@/, ':****@')}`);

  try {
    // 1. Test basic pg connection first
    console.log('--- Phase 1: Testing basic "pg" connection ---');
    const pool = new Pool({ connectionString });
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS: "pg" connection working. Time on DB:', res.rows[0].now);
    await pool.end();

    // 2. Test Prisma with Adapter
    console.log('\n--- Phase 2: Testing Prisma with Adapter ---');
    const adapter = new PrismaPg(new Pool({ connectionString }));
    const prisma = new PrismaClient({ adapter });
    
    // Simple query to verify model access
    const userCount = await prisma.user.count();
    console.log(`SUCCESS: Prisma connection working. Total users in DB: ${userCount}`);
    await prisma.$disconnect();

    console.log('\nCONCLUSION: Everything looks good! Both pg and Prisma can connect to the database.');
  } catch (err) {
    console.error('\nERROR: Connection failed during diagnostics.');
    console.error(err);
    
    if (err.code === 'ECONNREFUSED') {
      console.error('\nNOTE: Connection was refused. This often means:');
      console.error('  1. The Postgres service is not running on the server.');
      console.error('  2. The port (5433?) is incorrect. (Try 5432 if on cPanel local Postgres)');
      console.error('  3. A firewall is blocking the connection.');
    } else if (err.code === '28P01') {
      console.error('\nNOTE: Invalid password (28P01). Double check your .env credentials.');
    } else if (err.code === '3D000') {
      console.error('\nNOTE: Database does not exist (3D000). Check the database name in DATABASE_URL.');
    }
    
    process.exit(1);
  }
}

main();
