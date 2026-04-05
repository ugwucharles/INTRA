import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const orgId = process.env.META_DEFAULT_ORG_ID;

  if (!orgId) {
    throw new Error('META_DEFAULT_ORG_ID is not set in the environment');
  }

  console.log(`Seeding departments for org ${orgId}...`);

  // Ensure the organization exists (create it if missing)
  await prisma.organization.upsert({
    where: { id: orgId },
    update: {},
    create: {
      id: orgId,
      name: 'Default Org',
    },
  });

  const departmentNames = ['Sales', 'Support', 'Billing'];

  for (const name of departmentNames) {
    const existing = await prisma.department.findFirst({
      where: { orgId, name },
    });

    if (existing) {
      console.log(`Department "${name}" already exists (id=${existing.id})`);
      continue;
    }

    const created = await prisma.department.create({
      data: {
        orgId,
        name,
      },
    });

    console.log(`Created department "${name}" with id=${created.id}`);
  }

  console.log('Department seeding complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
