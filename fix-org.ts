import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.organization.updateMany({ data: { isOnboarded: true } });
  console.log('Fixed DB: Set isOnboarded=true for all organizations');
}

main().catch(console.error).finally(() => prisma.$disconnect());
