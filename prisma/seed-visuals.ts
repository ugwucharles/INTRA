import 'dotenv/config';
import { PrismaClient, UserRole, Channel, ConversationStatus, SenderType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Visual Seeding for INTRA BOX Started ---');

  const admin = await prisma.user.findFirst({
    where: { email: 'visuals.dummy@intrabox.com' },
  });

  if (!admin) {
    console.error('Admin user visuals.dummy@intrabox.com not found!');
    return;
  }

  const { orgId } = admin;

  // 1. Update Admin Profile
  await prisma.user.update({
    where: { id: admin.id },
    data: {
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      title: 'Head of Support',
    },
  });

  // 2. Clear then Add Customers & Conversations
  // First find customers to delete their related records if they exist (optional, but cleaner)
  
  const customer1 = await prisma.customer.create({
    data: {
      orgId,
      name: 'John Doe',
      email: 'john@example.com',
      source: Channel.WHATSAPP,
    },
  });

  const conv1 = await prisma.conversation.create({
    data: {
      orgId,
      customerId: customer1.id,
      status: ConversationStatus.OPEN,
      assignedTo: admin.id,
      firstResponseTime: 45,
      messages: {
        create: [
          { senderType: SenderType.CUSTOMER, content: 'Where is my order #12345?' },
          { senderType: SenderType.STAFF, senderId: admin.id, content: 'Checking that for you right now, John!' },
        ]
      }
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      orgId,
      name: 'Alice Smith',
      email: 'alice@example.com',
      source: Channel.FACEBOOK_MESSENGER,
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      orgId,
      customerId: customer2.id,
      status: ConversationStatus.RESOLVED,
      assignedTo: admin.id,
      firstResponseTime: 120,
      messages: {
        create: [
          { senderType: SenderType.CUSTOMER, content: 'Can I change my subscription?' },
          { senderType: SenderType.STAFF, senderId: admin.id, content: 'Yes! Just go to settings.' },
          { senderType: SenderType.CUSTOMER, content: 'Perfect, done. Thanks!' },
        ]
      }
    },
  });

  console.log('--- Visual Seeding for INTRA BOX Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
