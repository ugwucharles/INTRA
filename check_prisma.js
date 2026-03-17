const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['info', 'warn', 'error'] });

async function main() {
  const users = await prisma.user.findMany({ where: { isOnline: true } });
  console.log("ONLINE USERS:", JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
