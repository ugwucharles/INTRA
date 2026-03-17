const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany();
  for (const u of users) {
    if (u.name.toLowerCase().includes('jane')) {
      console.log('Found Jane:', u.name, u.email, 'Online:', u.isOnline);
      await prisma.user.update({
        where: { id: u.id },
        data: { isOnline: false }
      });
      console.log('Set Jane to offline.');
    }
  }
}
run().finally(() => prisma.$disconnect());
