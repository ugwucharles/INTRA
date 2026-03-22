import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Visual Seeding Started ---');

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

  // 2. Add Dummy Staff
  const staff1 = await prisma.user.create({
    data: {
      orgId,
      name: 'Sarah Miller',
      email: 'sarah.miller@intrabox.com',
      password: 'dummy-password',
      role: 'AGENT',
      title: 'Senior Agent',
      level: 'Senior',
      isActive: true,
      isOnline: true,
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      orgId,
      name: 'Mark Thompson',
      email: 'mark.thompson@intrabox.com',
      password: 'dummy-password',
      role: 'AGENT',
      title: 'Technical Support',
      level: 'Middle',
      isActive: true,
      isOnline: false,
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
  });

  // 3. Add Customers & Conversations
  const customer1 = await prisma.customer.create({
    data: {
      orgId,
      name: 'John Doe',
      email: 'john@example.com',
      source: 'WHATSAPP',
    },
  });

  const conv1 = await prisma.conversation.create({
    data: {
      orgId,
      customerId: customer1.id,
      status: 'OPEN',
      assignedTo: admin.id,
      firstResponseTime: 45, // 45 seconds
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, senderType: 'CUSTOMER', content: 'Where is my order #12345?' },
      { conversationId: conv1.id, senderType: 'STAFF', senderId: admin.id, content: 'Checking that for you right now, John!' },
    ],
  });

  const customer2 = await prisma.customer.create({
    data: {
      orgId,
      name: 'Alice Smith',
      email: 'alice@example.com',
      source: 'FACEBOOK_MESSENGER',
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      orgId,
      customerId: customer2.id,
      status: 'RESOLVED',
      assignedTo: staff1.id,
      firstResponseTime: 120, // 2 mins
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, senderType: 'CUSTOMER', content: 'Can I change my subscription?' },
      { conversationId: conv2.id, senderType: 'STAFF', senderId: staff1.id, content: 'Yes! Just go to settings.' },
      { conversationId: conv2.id, senderType: 'CUSTOMER', content: 'Perfect, done. Thanks!' },
    ],
  });

  const customer3 = await prisma.customer.create({
    data: {
      orgId,
      name: 'Elon Musk',
      email: 'elon@x.com',
      source: 'EMAIL',
    },
  });

  await prisma.conversation.create({
    data: {
      orgId,
      customerId: customer3.id,
      status: 'OPEN',
      assignedTo: staff2.id,
    },
  });

  console.log('--- Visual Seeding Completed ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
