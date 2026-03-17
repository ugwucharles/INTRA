import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.findFirst({ where: { name: 'Intra' } });
  if (!org) {
    console.log('Intra org not found');
    return;
  }
  const orgId = org.id;
  console.log('Clearing data for', orgId);

  await prisma.message.deleteMany({ where: { conversation: { orgId } } });
  await prisma.conversationNote.deleteMany({ where: { orgId } });
  await prisma.conversationTag.deleteMany({ where: { conversation: { orgId } } });
  await prisma.conversation.deleteMany({ where: { orgId } });
  await prisma.customerNote.deleteMany({ where: { orgId } });
  await prisma.customerTag.deleteMany({ where: { customer: { orgId } } });
  await prisma.customer.deleteMany({ where: { orgId } });

  console.log('Done clearing conversations and customers!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
