const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.organization.updateMany({ data: { isOnboarded: true } });
  console.log('Fixed DB: Set isOnboarded=true for all organizations');
}
main().catch(console.error).finally(() => prisma.$disconnect());
