const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const newEmail = 'cjnr598@email.com';
  
  console.log(`Updating admin email to ${newEmail}...`);
  
  // Find the admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!admin) {
    console.error('No admin user found');
    process.exit(1);
  }
  
  console.log(`Found admin: ${admin.email} (${admin.id})`);
  
  // Update the email
  const updated = await prisma.user.update({
    where: { id: admin.id },
    data: { email: newEmail }
  });
  
  console.log(`Updated admin email to: ${updated.email}`);
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
