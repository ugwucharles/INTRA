import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'admin@example.com';

  console.log(`Finding organizations with user email: ${targetEmail}`);

  // Find all users with the target email
  const users = await prisma.user.findMany({
    where: { email: targetEmail },
    select: { id: true, orgId: true, name: true },
  });

  if (users.length === 0) {
    console.log('No users found with this email.');
    return;
  }

  console.log(`Found ${users.length} user(s) with this email:`);
  users.forEach(user => {
    console.log(`  - User: ${user.name} (ID: ${user.id}), Org ID: ${user.orgId}`);
  });

  // Get unique organization IDs
  const orgIds = [...new Set(users.map(u => u.orgId))];
  console.log(`\nFound ${orgIds.length} unique organization(s) to delete.`);

  // Delete each organization with proper order to respect foreign keys
  for (const orgId of orgIds) {
    console.log(`\nDeleting organization ${orgId} and all related data...`);
    
    // Delete in order to respect foreign key constraints
    await prisma.conversationTag.deleteMany({ where: { orgId } });
    await prisma.customerTag.deleteMany({ where: { orgId } });
    await prisma.message.deleteMany({ where: { orgId } });
    await prisma.conversationNote.deleteMany({ where: { orgId } });
    await prisma.customerNote.deleteMany({ where: { orgId } });
    await prisma.conversation.deleteMany({ where: { orgId } });
    await prisma.customer.deleteMany({ where: { orgId } });
    await prisma.savedReply.deleteMany({ where: { orgId } });
    await prisma.autoReply.deleteMany({ where: { orgId } });
    await prisma.tag.deleteMany({ where: { orgId } });
    await prisma.department.deleteMany({ where: { orgId } });
    await prisma.socialAccount.deleteMany({ where: { orgId } });
    await prisma.auditLog.deleteMany({ where: { orgId } });
    await prisma.routingSettings.deleteMany({ where: { orgId } });
    await prisma.user.deleteMany({ where: { orgId } });
    
    await prisma.organization.delete({
      where: { id: orgId },
    });
    console.log(`Organization ${orgId} deleted successfully.`);
  }

  console.log('\n✅ All organizations with this email have been deleted.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
