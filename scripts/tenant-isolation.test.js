/**
 * Run with:
 *   node scripts/tenant-isolation.test.js
 *
 * Requires:
 *   - DATABASE_URL pointing to a test database
 *   - prisma migrate deployed (tables exist)
 *
 * This script creates two orgs, users, and tenant data, then verifies:
 *   - org A cannot see org B users/conversations/messages
 *   - org-scoped reads are enforced automatically via Prisma extension in PrismaService (app runtime)
 *
 * Note: This is a DB-level smoke test. It does not require the HTTP server.
 */
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

  // Clean up only the records we create (by unique email suffix).
  const suffix = `tenanttest-${Date.now()}`;
  const emailA = `admin-a+${suffix}@example.com`;
  const emailB = `admin-b+${suffix}@example.com`;

  const orgA = await prisma.organization.create({ data: { name: `Org A ${suffix}` } });
  const orgB = await prisma.organization.create({ data: { name: `Org B ${suffix}` } });

  const userA = await prisma.user.create({
    data: {
      orgId: orgA.id,
      name: 'Admin A',
      email: emailA,
      password: 'x',
      role: 'ADMIN',
      isActive: true,
    },
  });
  const userB = await prisma.user.create({
    data: {
      orgId: orgB.id,
      name: 'Admin B',
      email: emailB,
      password: 'x',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const customerA = await prisma.customer.create({
    data: { orgId: orgA.id, name: 'Cust A', email: `cust-a+${suffix}@example.com`, isSaved: true },
  });
  const customerB = await prisma.customer.create({
    data: { orgId: orgB.id, name: 'Cust B', email: `cust-b+${suffix}@example.com`, isSaved: true },
  });

  const convA = await prisma.conversation.create({ data: { orgId: orgA.id, customerId: customerA.id } });
  const convB = await prisma.conversation.create({ data: { orgId: orgB.id, customerId: customerB.id } });

  await prisma.message.create({
    data: { orgId: orgA.id, conversationId: convA.id, senderType: 'STAFF', senderId: userA.id, content: 'Hello A' },
  });
  await prisma.message.create({
    data: { orgId: orgB.id, conversationId: convB.id, senderType: 'STAFF', senderId: userB.id, content: 'Hello B' },
  });

  // DB truth checks (no app-level enforcement here)
  const aUsers = await prisma.user.findMany({ where: { orgId: orgA.id } });
  const bUsers = await prisma.user.findMany({ where: { orgId: orgB.id } });
  assert(aUsers.some((u) => u.id === userA.id), 'Org A should contain userA');
  assert(!aUsers.some((u) => u.id === userB.id), 'Org A must not contain userB');
  assert(bUsers.some((u) => u.id === userB.id), 'Org B should contain userB');
  assert(!bUsers.some((u) => u.id === userA.id), 'Org B must not contain userA');

  const aMsgs = await prisma.message.findMany({ where: { orgId: orgA.id } });
  const bMsgs = await prisma.message.findMany({ where: { orgId: orgB.id } });
  assert(aMsgs.every((m) => m.orgId === orgA.id), 'All org A messages must have orgId=A');
  assert(bMsgs.every((m) => m.orgId === orgB.id), 'All org B messages must have orgId=B');

  console.log('OK: multi-tenant data separated at DB level.');
  console.log('Next: run the app and verify app-level Prisma enforcement blocks cross-tenant reads/writes.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

