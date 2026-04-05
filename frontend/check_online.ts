import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
prisma.user.findMany({ where: { isOnline: true } })
  .then(users => console.dir(users, { depth: null }))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
