"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma = new client_1.PrismaClient({ adapter: new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL }) });
async function main() {
    const customers = await prisma.customer.findMany({
        where: { email: { contains: 'preston' } },
        include: { conversations: { include: { messages: true } } },
    });
    console.log('Found:', customers.length);
    for (const c of customers) {
        console.log(`  ${c.email} | ${c.conversations.length} conversation(s)`);
        for (const conv of c.conversations) {
            console.log(`    conv ${conv.id} | ${conv.messages.length} message(s)`);
        }
    }
    const recent = await prisma.customer.findMany({
        where: { orgId: process.env.META_DEFAULT_ORG_ID, source: 'EMAIL' },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });
    console.log('\nLast 5 EMAIL customers:');
    for (const c of recent) {
        console.log(`  ${c.email} (${c.createdAt.toISOString()})`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-preston.js.map