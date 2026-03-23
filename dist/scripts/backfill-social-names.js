"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({ adapter });
async function fetchMessengerName(psid) {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!accessToken)
        return null;
    try {
        const url = new URL(`https://graph.facebook.com/v19.0/${psid}`);
        url.searchParams.set('access_token', accessToken);
        url.searchParams.set('fields', 'name');
        const res = await fetch(url.toString());
        if (!res.ok)
            return null;
        const data = await res.json().catch(() => null);
        if (!data || typeof data.name !== 'string')
            return null;
        const trimmed = data.name.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    catch {
        return null;
    }
}
async function fetchInstagramName(igSenderId) {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN ?? process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken)
        return null;
    try {
        const url = new URL(`https://graph.facebook.com/v19.0/${igSenderId}`);
        url.searchParams.set('access_token', accessToken);
        url.searchParams.set('fields', 'name,username');
        const res = await fetch(url.toString());
        if (!res.ok)
            return null;
        const data = await res.json().catch(() => null);
        if (!data)
            return null;
        const nameCandidate = (typeof data.name === 'string' && data.name.trim().length > 0
            ? data.name.trim()
            : null) ||
            (typeof data.username === 'string' && data.username.trim().length > 0
                ? data.username.trim()
                : null);
        return nameCandidate || null;
    }
    catch {
        return null;
    }
}
async function main() {
    console.log('Backfilling social names for Messenger and Instagram customers...');
    const customers = await prisma.customer.findMany({
        where: {
            source: { in: [client_1.Channel.FACEBOOK_MESSENGER, client_1.Channel.INSTAGRAM] },
            externalId: { not: null },
            OR: [{ name: null }, { name: '' }],
        },
        take: 5000,
    });
    console.log(`Found ${customers.length} customers to backfill`);
    for (const customer of customers) {
        const externalId = customer.externalId;
        let displayName = null;
        if (customer.source === client_1.Channel.FACEBOOK_MESSENGER) {
            displayName = await fetchMessengerName(externalId);
        }
        else if (customer.source === client_1.Channel.INSTAGRAM) {
            displayName = await fetchInstagramName(externalId);
        }
        if (!displayName) {
            continue;
        }
        await prisma.customer.update({
            where: { id: customer.id },
            data: { name: displayName },
        });
        console.log(`Updated customer ${customer.id} (${customer.source}) with name "${displayName}"`);
    }
    console.log('Backfill complete');
}
main()
    .catch((err) => {
    console.error(err);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=backfill-social-names.js.map