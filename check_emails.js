require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const msgs = await prisma.message.findMany({
    where: {
      senderType: 'CUSTOMER',
      conversation: { customer: { source: 'EMAIL' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      externalId: true,
      content: true,
      createdAt: true,
      conversationId: true,
    },
  });

  console.log('=== Last 10 inbound EMAIL messages ===');
  if (msgs.length === 0) {
    console.log('No email messages found in DB.');
  } else {
    msgs.forEach((m, i) => {
      console.log(`\n[${i + 1}] UID(externalId): ${m.externalId ?? 'NULL (old message)'}`);
      console.log(`    conversationId : ${m.conversationId}`);
      console.log(`    createdAt      : ${m.createdAt}`);
      console.log(`    content snippet: ${m.content.slice(0, 80).replace(/\n/g, ' ')}...`);
    });
  }

  const nullCount = await prisma.message.count({
    where: {
      senderType: 'CUSTOMER',
      externalId: null,
      conversation: { customer: { source: 'EMAIL' } },
    },
  });
  console.log(`\n=== Messages WITHOUT externalId (pre-fix): ${nullCount} ===`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
