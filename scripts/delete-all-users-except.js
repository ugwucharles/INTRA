/**
 * Delete every User row except those whose email matches the keeper (case-insensitive).
 * Same email in different orgs is kept for all matching rows.
 *
 * Usage (from repo root INTRA/, with DATABASE_URL in .env):
 *   node scripts/delete-all-users-except.js reviewer@example.com --confirm=DELETE_ALL_USERS_EXCEPT_ONE
 *
 * Or:
 *   KEEP_USER_EMAIL=reviewer@example.com CONFIRM_DELETE_USERS=DELETE_ALL_USERS_EXCEPT_ONE node scripts/delete-all-users-except.js
 *
 * Cleans dependent rows that reference User with ON DELETE RESTRICT:
 *   ConversationNote (authorId), CustomerNote (userId), AuditLog (userId).
 * Conversation.assignedTo uses ON DELETE SET NULL — no manual update needed.
 * _DepartmentToUser uses ON DELETE CASCADE on User — no manual update needed.
 */
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const REQUIRED_CONFIRMATION = 'DELETE_ALL_USERS_EXCEPT_ONE';

function parseArgs() {
  const args = process.argv.slice(2);
  let keeperEmail = (process.env.KEEP_USER_EMAIL || '').trim();
  let confirm =
    process.env.CONFIRM_DELETE_USERS ||
    args.find((a) => a.startsWith('--confirm='))?.split('=')[1];

  for (const a of args) {
    if (a.startsWith('--keeper-email=')) {
      keeperEmail = a.split('=')[1]?.trim() || keeperEmail;
    } else if (!a.startsWith('--') && a.includes('@')) {
      keeperEmail = a.trim();
    }
  }

  return {
    keeperEmail: keeperEmail.toLowerCase(),
    confirm,
  };
}

async function main() {
  const { keeperEmail, confirm } = parseArgs();

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Load .env or export DATABASE_URL.');
    process.exit(1);
  }

  if (!keeperEmail) {
    console.error(
      [
        'Missing keeper email.',
        'Pass as first argument: node scripts/delete-all-users-except.js reviewer@fb.com --confirm=...',
        'Or: --keeper-email=reviewer@fb.com',
        'Or env: KEEP_USER_EMAIL=reviewer@fb.com',
      ].join('\n'),
    );
    process.exit(1);
  }

  if (confirm !== REQUIRED_CONFIRMATION) {
    console.error(
      [
        'Refusing to run destructive cleanup.',
        `Pass: --confirm=${REQUIRED_CONFIRMATION}`,
        `Or set env: CONFIRM_DELETE_USERS=${REQUIRED_CONFIRMATION}`,
      ].join('\n'),
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const keepers = await prisma.user.findMany({
      where: {
        email: { equals: keeperEmail, mode: 'insensitive' },
      },
      select: { id: true, email: true, name: true, orgId: true, role: true },
    });

    if (keepers.length === 0) {
      console.error(`No user found with email matching (case-insensitive): ${keeperEmail}`);
      process.exitCode = 1;
      return;
    }

    console.log('Keeping user(s):');
    for (const k of keepers) {
      console.log(`  - ${k.email} | ${k.name} | ${k.role} | orgId=${k.orgId} | id=${k.id}`);
    }

    const keeperIds = new Set(keepers.map((k) => k.id));

    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    const toDeleteIds = allUsers.filter((u) => !keeperIds.has(u.id)).map((u) => u.id);

    if (toDeleteIds.length === 0) {
      console.log('\nNo other users to delete. Database unchanged.');
      return;
    }

    console.log(`\nDeleting ${toDeleteIds.length} user(s). First few:`);
    for (const u of allUsers.filter((u) => !keeperIds.has(u.id)).slice(0, 15)) {
      console.log(`  - ${u.email} | ${u.name} | id=${u.id}`);
    }
    if (toDeleteIds.length > 15) console.log(`  ... and ${toDeleteIds.length - 15} more`);

    await prisma.$transaction(
      async (tx) => {
        const del = await tx.conversationNote.deleteMany({
          where: { authorId: { in: toDeleteIds } },
        });
        console.log(`  Deleted ConversationNote rows: ${del.count}`);

        const delCn = await tx.customerNote.deleteMany({
          where: { userId: { in: toDeleteIds } },
        });
        console.log(`  Deleted CustomerNote rows: ${delCn.count}`);

        const delAl = await tx.auditLog.deleteMany({
          where: { userId: { in: toDeleteIds } },
        });
        console.log(`  Deleted AuditLog rows: ${delAl.count}`);

        const delUsers = await tx.user.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
        console.log(`  Deleted User rows: ${delUsers.count}`);
      },
      { maxWait: 10000, timeout: 120000 },
    );

    const remaining = await prisma.user.count();
    console.log(`\nDone. User table now has ${remaining} row(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((err) => {
    console.error('delete-all-users-except failed:', err);
    process.exit(1);
  });
