import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany({
    where: {
      senderType: 'CUSTOMER',
      externalId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      conversation: {
        include: {
          customer: true
        }
      }
    }
  });

  console.log('Recent Customer Messages:');
  messages.forEach(m => {
    console.log(`ID: ${m.id} | UID: ${m.externalId} | From: ${m.conversation.customer.email} | Content Snippet: ${m.content.substring(0, 30)}... | CreatedAt: ${m.createdAt}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
