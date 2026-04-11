import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const orgs = await prisma.organization.findMany({
    include: {
      socialAccounts: true, // socialAccounts represent the channels for the organization
    },
  });

  console.log(`Found ${orgs.length} organizations:\n`);

  for (const org of orgs) {
    console.log(`Organization: ${org.name} (ID: ${org.id})`);
    
    if (org.socialAccounts.length === 0) {
      console.log(`  - No channels`);
    } else {
      for (const account of org.socialAccounts) {
        console.log(`  - Channel: ${account.channel} (DisplayName: ${account.displayName || 'N/A'}, PageID: ${account.pageId || 'N/A'}, Active: ${account.isActive})`);
      }
    }
    console.log('--------------------------------------------------');
  }
}

main()
  .catch((e) => {
    console.error('Error listing organizations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
