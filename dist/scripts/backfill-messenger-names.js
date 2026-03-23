"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function fetchMessengerName(psid, pageAccessToken) {
    const url = new URL(`https://graph.facebook.com/${encodeURIComponent(psid)}`);
    url.searchParams.set('fields', 'name');
    url.searchParams.set('access_token', pageAccessToken);
    try {
        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.warn(`Failed to fetch Messenger profile for PSID=${psid}: ${res.status} ${res.statusText} ${text}`);
            return null;
        }
        const data = await res.json().catch(() => null);
        const name = data?.name;
        if (typeof name === 'string' && name.trim().length > 0) {
            return name.trim();
        }
        console.log(`Messenger profile for PSID=${psid} has no name field`);
        return null;
    }
    catch (err) {
        console.error('Error calling Facebook Graph API for profile name', err);
        return null;
    }
}
async function main() {
    const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!pageAccessToken) {
        console.error('META_PAGE_ACCESS_TOKEN is not set. Aborting backfill.');
        process.exit(1);
    }
    const customers = await prisma.customer.findMany({
        where: {
            source: client_1.Channel.FACEBOOK_MESSENGER,
            externalId: { not: null },
            OR: [{ name: null }, { name: '' }],
        },
        orderBy: { createdAt: 'asc' },
    });
    console.log(`Found ${customers.length} Messenger customers without names to backfill.`);
    let updatedCount = 0;
    for (const customer of customers) {
        const psid = customer.externalId;
        console.log(`\n[${customer.id}] Fetching name for PSID=${psid}...`);
        const name = await fetchMessengerName(psid, pageAccessToken);
        if (!name) {
            console.log('  -> Skipping (no name returned).');
            continue;
        }
        try {
            await prisma.customer.update({
                where: { id: customer.id },
                data: { name },
            });
            updatedCount += 1;
            console.log(`  -> Updated customer name to "${name}"`);
        }
        catch (err) {
            console.error(`  -> Failed to update customer ${customer.id}`, err);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
    }
    console.log(`\nBackfill complete. Updated ${updatedCount} customers.`);
}
main()
    .catch((err) => {
    console.error('Unexpected error during backfill', err);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill-messenger-names.js.map