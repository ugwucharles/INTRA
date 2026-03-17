import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check email customers
  const emailCustomers = await prisma.customer.findMany({
    where: { source: 'EMAIL' },
    include: {
      conversations: {
        include: { messages: true },
      },
    },
  });

  console.log('\n--- Email Customers in DB ---');
  console.log('Total:', emailCustomers.length);

  if (emailCustomers.length === 0) {
    console.log('No EMAIL customers found — emails are NOT being saved to the database.');
    console.log('The processIncomingEmail function is likely throwing an error silently.');
  }

  for (const c of emailCustomers) {
    console.log(`\nCustomer: ${c.email} | orgId: ${c.orgId}`);
    console.log(`  Conversations: ${c.conversations.length}`);
    for (const conv of c.conversations) {
      console.log(`    - conv ${conv.id} | status: ${conv.status} | assignedTo: ${conv.assignedTo ?? 'unassigned'} | messages: ${conv.messages.length}`);
    }
  }

  // Check what orgId is configured
  const configuredOrgId = process.env.META_DEFAULT_ORG_ID;
  console.log(`\n--- Config ---`);
  console.log(`META_DEFAULT_ORG_ID: ${configuredOrgId}`);

  // Check if that org exists
  const org = await prisma.organization.findUnique({ where: { id: configuredOrgId! } });
  console.log(`Org found: ${org ? org.name : 'NOT FOUND — this would cause all email processing to fail!'}`);

  // Check all orgs
  const allOrgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  console.log(`\nAll orgs:`);
  for (const o of allOrgs) {
    console.log(`  - ${o.name} (${o.id})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
