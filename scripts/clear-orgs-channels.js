require('dotenv/config');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const REQUIRED_CONFIRMATION = 'DELETE_ALL_ORGS_AND_CHANNELS';
const cliConfirmArg = process.argv.find((arg) => arg.startsWith('--confirm='));
const cliConfirmValue = cliConfirmArg?.split('=')[1];
const confirmationValue = cliConfirmValue || process.env.CONFIRM_CLEAR_ORGS;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

if (confirmationValue !== REQUIRED_CONFIRMATION) {
  console.error(
    [
      'Refusing to run destructive cleanup.',
      `Pass confirmation exactly as: --confirm=${REQUIRED_CONFIRMATION}`,
      `or set env var: CONFIRM_CLEAR_ORGS=${REQUIRED_CONFIRMATION}`,
    ].join('\n'),
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const deleteSteps = [
  { name: 'ConversationTag', run: (tx) => tx.conversationTag.deleteMany() },
  { name: 'CustomerTag', run: (tx) => tx.customerTag.deleteMany() },
  { name: 'ConversationNote', run: (tx) => tx.conversationNote.deleteMany() },
  { name: 'CustomerNote', run: (tx) => tx.customerNote.deleteMany() },
  { name: 'Message', run: (tx) => tx.message.deleteMany() },
  { name: 'AuditLog', run: (tx) => tx.auditLog.deleteMany() },
  { name: 'SavedReply', run: (tx) => tx.savedReply.deleteMany() },
  { name: 'AutoReply', run: (tx) => tx.autoReply.deleteMany() },
  { name: 'RoutingSettings', run: (tx) => tx.routingSettings.deleteMany() },
  { name: 'Conversation', run: (tx) => tx.conversation.deleteMany() },
  { name: 'Customer', run: (tx) => tx.customer.deleteMany() },
  { name: 'Tag', run: (tx) => tx.tag.deleteMany() },
  { name: 'SocialAccount (channels)', run: (tx) => tx.socialAccount.deleteMany() },
  { name: 'User', run: (tx) => tx.user.deleteMany() },
  { name: 'Department', run: (tx) => tx.department.deleteMany() },
  { name: 'Organization', run: (tx) => tx.organization.deleteMany() },
];

async function getSnapshot() {
  const [
    organizations,
    socialAccounts,
    users,
    departments,
    customers,
    conversations,
    messages,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.socialAccount.count(),
    prisma.user.count(),
    prisma.department.count(),
    prisma.customer.count(),
    prisma.conversation.count(),
    prisma.message.count(),
  ]);

  return {
    organizations,
    socialAccounts,
    users,
    departments,
    customers,
    conversations,
    messages,
  };
}

async function main() {
  const before = await getSnapshot();
  console.log('Current data snapshot:', before);

  if (before.organizations === 0 && before.socialAccounts === 0) {
    console.log('No organizations/channels found. Nothing to delete.');
    return;
  }

  const deleted = {};

  await prisma.$transaction(
    async (tx) => {
      for (const step of deleteSteps) {
        const result = await step.run(tx);
        deleted[step.name] = result.count;
      }
    },
    {
      maxWait: 10000,
      timeout: 120000,
    },
  );

  const after = await getSnapshot();
  console.log('Deleted row counts:', deleted);
  console.log('Remaining data snapshot:', after);
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
