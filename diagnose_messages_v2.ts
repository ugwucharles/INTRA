import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.message.count();
  const lastMessages = await prisma.message.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
        conversation: {
            include: {
                customer: true
            }
        }
    }
  });

  console.log(`Total Messages: ${count}`);
  lastMessages.forEach(m => {
    console.log(`[${m.createdAt.toISOString()}] From: ${m.senderType} | UID: ${m.externalId || 'N/A'} | Content: ${m.content.substring(0, 50)}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
