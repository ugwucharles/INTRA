import 'dotenv/config';
import { PrismaClient, UserRole, Channel, TagType, ConversationStatus, SenderType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('🚫 Seed script is disabled in production. Exiting.');
    process.exit(1);
  }

  console.log('Seeding INTRA dev data...');

  // 1) Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Org',
    },
  });

  // 2) Create staff (one admin, a couple of agents)
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      name: 'Alice Admin',
      email: 'admin@example.com',
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      isOnline: true,
    },
  });

  const agentBob = await prisma.user.create({
    data: {
      orgId: org.id,
      name: 'Bob Agent',
      email: 'bob@example.com',
      password: passwordHash,
      role: UserRole.AGENT,
      isActive: true,
      isOnline: true,
    },
  });

  const agentCarol = await prisma.user.create({
    data: {
      orgId: org.id,
      name: 'Carol Agent',
      email: 'carol@example.com',
      password: passwordHash,
      role: UserRole.AGENT,
      isActive: true,
      isOnline: false,
    },
  });

  // 3) Departments
  const salesDept = await prisma.department.create({
    data: {
      orgId: org.id,
      name: 'Sales',
      isActive: true,
      users: {
        connect: [{ id: agentBob.id }],
      },
    },
  });

  const supportDept = await prisma.department.create({
    data: {
      orgId: org.id,
      name: 'Support',
      isActive: true,
      users: {
        connect: [{ id: agentCarol.id }],
      },
    },
  });

  // 4) Saved replies
  await prisma.savedReply.createMany({
    data: [
      {
        orgId: org.id,
        departmentId: salesDept.id,
        name: 'Pricing info',
        shortcut: '/pricing',
        body: 'Hi! Our pricing starts at $29/month. Would you like a link to the full price list?',
        isActive: true,
      },
      {
        orgId: org.id,
        departmentId: supportDept.id,
        name: 'Refund policy',
        shortcut: '/refund',
        body: 'Our refund policy allows refunds within 14 days of purchase. Can you share your order ID?',
        isActive: true,
      },
    ],
  });

  // 5) Tags (conversation + customer)
  const urgentTag = await prisma.tag.create({
    data: {
      orgId: org.id,
      name: 'Urgent',
      type: TagType.CONVERSATION,
      color: '#EF4444',
    },
  });

  const salesLeadTag = await prisma.tag.create({
    data: {
      orgId: org.id,
      name: 'Sales Lead',
      type: TagType.CONVERSATION,
      color: '#3B82F6',
    },
  });

  const vipCustomerTag = await prisma.tag.create({
    data: {
      orgId: org.id,
      name: 'VIP',
      type: TagType.CUSTOMER,
      color: '#F59E0B',
    },
  });

  // 6) Customers (one from Instagram, one from Facebook)
  const instaCustomer = await prisma.customer.create({
    data: {
      orgId: org.id,
      name: 'John – Lagos',
      email: 'john.instagram@example.com',
      phone: '+2348000000001',
      externalId: 'insta-user-123',
      source: Channel.INSTAGRAM,
      pageId: 'insta-page-1',
      isSaved: true,
    },
  });

  const fbCustomer = await prisma.customer.create({
    data: {
      orgId: org.id,
      name: 'Sarah – Nairobi',
      email: 'sarah.facebook@example.com',
      phone: '+254700000002',
      externalId: 'fb-user-456',
      source: Channel.FACEBOOK_MESSENGER,
      pageId: 'fb-page-1',
      isSaved: true,
    },
  });

  // Customer tags
  await prisma.customerTag.create({
    data: {
      customerId: instaCustomer.id,
      tagId: vipCustomerTag.id,
    },
  });

  // 7) Conversations & messages
  const instaConversation = await prisma.conversation.create({
    data: {
      orgId: org.id,
      customerId: instaCustomer.id,
      assignedTo: agentBob.id,
      status: ConversationStatus.OPEN,
      isStarred: true,
      departmentId: salesDept.id,
      messages: {
        create: [
          {
            senderType: SenderType.CUSTOMER,
            content: 'Hey, I found you on Instagram. I want to know more about your pricing.',
            externalId: 'msg-insta-1',
          },
          {
            senderType: SenderType.STAFF,
            senderId: agentBob.id,
            content: 'Hi John! Happy to help – what are you looking to do with INTRA?',
            externalId: 'msg-insta-2',
          },
        ],
      },
      tags: {
        create: [
          {
            tagId: urgentTag.id,
          },
          {
            tagId: salesLeadTag.id,
          },
        ],
      },
    },
  });

  const fbConversation = await prisma.conversation.create({
    data: {
      orgId: org.id,
      customerId: fbCustomer.id,
      assignedTo: agentCarol.id,
      status: ConversationStatus.PENDING,
      isStarred: false,
      departmentId: supportDept.id,
      messages: {
        create: [
          {
            senderType: SenderType.CUSTOMER,
            content: 'Hi, I have an issue with my last order.',
            externalId: 'msg-fb-1',
          },
          {
            senderType: SenderType.STAFF,
            senderId: agentCarol.id,
            content: 'Hi Sarah, I am sorry to hear that. Can you send me your order ID?',
            externalId: 'msg-fb-2',
          },
        ],
      },
      tags: {
        create: [
          {
            tagId: urgentTag.id,
          },
        ],
      },
    },
  });

  // 8) Internal conversation notes
  await prisma.conversationNote.createMany({
    data: [
      {
        orgId: org.id,
        conversationId: instaConversation.id,
        authorId: agentBob.id,
        content: 'Customer seems very interested in annual plan. Follow up tomorrow.',
      },
      {
        orgId: org.id,
        conversationId: fbConversation.id,
        authorId: agentCarol.id,
        content: 'Order issue likely related to shipping delay. Check with logistics.',
      },
    ],
  });

  // 9) Private customer notes (per-agent)
  await prisma.customerNote.createMany({
    data: [
      {
        orgId: org.id,
        customerId: instaCustomer.id,
        userId: agentBob.id,
        content: 'High-value lead from Instagram ads.',
      },
      {
        orgId: org.id,
        customerId: fbCustomer.id,
        userId: agentCarol.id,
        content: 'Had a previous minor issue but resolved quickly.',
      },
    ],
  });

  console.log('Seeding complete. Admin login: admin@example.com / password123');

  // --- EXTRA SEEDING FOR USER REQUEST ---
  const extraOrgId = org.id;
  console.log(`Seeding EXTRA data for org: ${extraOrgId}`);

  const dept1 = await prisma.department.create({
    data: {
      orgId: extraOrgId,
      name: 'Technical Support',
      isActive: true,
    },
  });

  const dept2 = await prisma.department.create({
    data: {
      orgId: extraOrgId,
      name: 'Account Management',
      isActive: true,
    },
  });

  const extraPasswordHash = await bcrypt.hash('password123', 10);
  const extraStaffData = [
    { name: 'James Wilson', email: 'james@example.com' },
    { name: 'Linda Chen', email: 'linda@example.com' },
    { name: 'Robert Taylor', email: 'robert@example.com' },
    { name: 'Maria Garcia', email: 'maria@example.com' },
    { name: 'David Miller', email: 'david@example.com' },
    { name: 'Sarah Brown', email: 'sarah@example.com' },
    { name: 'Michael Davis', email: 'michael@example.com' },
    { name: 'Karen White', email: 'karen@example.com' },
    { name: 'Thomas Moore', email: 'thomas@example.com' },
    { name: 'Nancy King', email: 'nancy@example.com' },
  ];

  for (let i = 0; i < extraStaffData.length; i++) {
    const data = extraStaffData[i];
    try {
      await prisma.user.create({
        data: {
          orgId: extraOrgId,
          name: data.name,
          email: data.email,
          password: extraPasswordHash,
          role: UserRole.AGENT,
          isActive: true,
          isOnline: i < 2,
          departments: {
            connect: { id: i < 5 ? dept1.id : dept2.id },
          },
        },
      });
      console.log(`Created extra staff: ${data.name} (${data.email})`);
    } catch (err: any) {
      if (err.code !== 'P2002') throw err;
    }
  }
  console.log('--- EXTRA SEEDING COMPLETE ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
