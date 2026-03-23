"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
const TARGET_ORG = process.env.META_DEFAULT_ORG_ID;
async function main() {
    const allCustomers = await prisma.customer.findMany({
        where: { orgId: TARGET_ORG },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });
    console.log(`\n--- Last 20 customers in org ${TARGET_ORG} ---`);
    for (const c of allCustomers) {
        console.log(`  [${c.source ?? 'null'}] ${c.email ?? c.phone ?? c.externalId} (created: ${c.createdAt.toISOString()})`);
    }
    const testCustomers = await prisma.customer.findMany({
        where: {
            OR: [
                { email: { contains: 'jnrtoby0' } },
                { email: { contains: 'cjnr598' } },
            ],
        },
    });
    console.log(`\n--- Test email customers (jnrtoby0 / cjnr598) ---`);
    console.log(`Found: ${testCustomers.length}`);
    for (const c of testCustomers) {
        console.log(`  ${c.email} | source: ${c.source} | orgId: ${c.orgId}`);
    }
    const recentConvs = await prisma.conversation.findMany({
        where: { orgId: TARGET_ORG },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            customer: true,
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
    });
    console.log(`\n--- Last 10 conversations in org ---`);
    for (const conv of recentConvs) {
        const lastMsg = conv.messages[0];
        console.log(`  conv ${conv.id} | customer: ${conv.customer.email ?? conv.customer.phone ?? conv.customer.externalId} | source: ${conv.customer.source} | status: ${conv.status} | msgs: (last: ${lastMsg?.content?.slice(0, 40) ?? 'none'})`);
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test-db2.js.map