const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'visuals.dummy@intrabox.com' }
  });
  if (user) {
    console.log('USER_FOUND:' + JSON.stringify(user));
  } else {
    console.log('USER_NOT_FOUND');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
