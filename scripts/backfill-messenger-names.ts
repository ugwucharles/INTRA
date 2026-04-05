import 'dotenv/config';
import { PrismaClient, Channel } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function fetchMessengerName(psid: string, pageAccessToken: string): Promise<string | null> {
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
      console.warn(
        `Failed to fetch Messenger profile for PSID=${psid}: ${res.status} ${res.statusText} ${text}`,
      );
      return null;
    }

    const data: any = await res.json().catch(() => null);
    const name = data?.name;
    if (typeof name === 'string' && name.trim().length > 0) {
      return name.trim();
    }

    console.log(`Messenger profile for PSID=${psid} has no name field`);
    return null;
  } catch (err) {
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

  // Find Messenger customers that have a PSID but no name yet (or an empty name)
  const customers = await prisma.customer.findMany({
    where: {
      source: Channel.FACEBOOK_MESSENGER,
      externalId: { not: null },
      OR: [{ name: null }, { name: '' }],
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${customers.length} Messenger customers without names to backfill.`);

  let updatedCount = 0;

  for (const customer of customers) {
    const psid = customer.externalId!;
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
    } catch (err) {
      console.error(`  -> Failed to update customer ${customer.id}`, err);
    }

    // Optional: small delay to avoid hitting rate limits too hard
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
