require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // List all orgs
  const orgs = await prisma.organization.findMany();
  console.log('Found orgs:', orgs.map(o => ({ id: o.id, name: o.name })));

  if (orgs.length === 0) {
    console.log('No orgs found');
    return;
  }

  // Use the first org (or find by name)
  const org = orgs[0];
  const orgId = org.id;
  console.log('Clearing data for org:', org.name, '(', orgId, ')');

  await prisma.message.deleteMany({ where: { conversation: { orgId } } });
  console.log('Messages deleted');
  await prisma.conversationNote.deleteMany({ where: { orgId } });
  console.log('Conversation notes deleted');
  await prisma.conversationTag.deleteMany({ where: { conversation: { orgId } } });
  console.log('Conversation tags deleted');
  await prisma.conversation.deleteMany({ where: { orgId } });
  console.log('Conversations deleted');
  await prisma.customerNote.deleteMany({ where: { orgId } });
  console.log('Customer notes deleted');
  await prisma.customerTag.deleteMany({ where: { customer: { orgId } } });
  console.log('Customer tags deleted');
  await prisma.customer.deleteMany({ where: { orgId } });
  console.log('Customers deleted');

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error('Error:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
