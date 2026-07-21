import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all conversation tags...');
  const deletedConvTags = await prisma.conversationTag.deleteMany({});
  console.log(`Deleted ${deletedConvTags.count} conversation tags.`);

  console.log('Clearing all customer tags...');
  const deletedCustTags = await prisma.customerTag.deleteMany({});
  console.log(`Deleted ${deletedCustTags.count} customer tags.`);

  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
