import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TARGET_ORG = process.env.META_DEFAULT_ORG_ID!;

async function main() {
  // 1. All customers for the target org, any source
  const allCustomers = await prisma.customer.findMany({
    where: { orgId: TARGET_ORG },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  console.log(`\n--- Last 20 customers in org ${TARGET_ORG} ---`);
  for (const c of allCustomers) {
    console.log(`  [${c.source ?? 'null'}] ${c.email ?? c.phone ?? c.externalId} (created: ${c.createdAt.toISOString()})`);
  }

  // 2. Specifically look for jnrtoby0 / cjnr598
  const testCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { email: { contains: 'jnrtoby0' } },
        { email: { contains: 'cjnr598' } },
      ],
    },
  });
  console.log(`\n--- Test email customers (jnrtoby0 / cjnr598) ---`);
  console.log(`Found: ${testCustomers.length}`);
  for (const c of testCustomers) {
    console.log(`  ${c.email} | source: ${c.source} | orgId: ${c.orgId}`);
  }

  // 3. All recent conversations
  const recentConvs = await prisma.conversation.findMany({
    where: { orgId: TARGET_ORG },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      customer: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  console.log(`\n--- Last 10 conversations in org ---`);
  for (const conv of recentConvs) {
    const lastMsg = conv.messages[0];
    console.log(`  conv ${conv.id} | customer: ${conv.customer.email ?? conv.customer.phone ?? conv.customer.externalId} | source: ${conv.customer.source} | status: ${conv.status} | msgs: (last: ${lastMsg?.content?.slice(0, 40) ?? 'none'})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
