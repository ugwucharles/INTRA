require('dotenv/config');

const { PrismaClient, Channel } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, ...rest] = arg.slice(2).split('=');
    args[k] = rest.length ? rest.join('=') : true;
  }
  return args;
}

function redactToken(token) {
  if (!token || typeof token !== 'string') return '<missing>';
  if (token.length <= 10) return `${token.slice(0, 3)}***`;
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

function explainMetaError(errorPayload, channel) {
  const err = errorPayload?.error || {};
  const code = err.code;
  const subcode = err.error_subcode;
  const message = err.message || 'Unknown Meta error';

  const hints = [];

  if (code === 190) {
    hints.push('Access token expired/invalid. Reconnect the channel in INTRA.');
  }
  if (code === 10 || code === 200) {
    hints.push(
      'Permission issue. Ensure app has messaging permissions and is approved/live.',
    );
  }
  if (code === 100) {
    hints.push('Payload/recipient issue (wrong recipient id or invalid message body).');
  }
  if (code === 551 || subcode === 2018001 || subcode === 2534022) {
    hints.push(
      'Outside Meta messaging window or user has not interacted recently (template/tag may be required).',
    );
  }
  if (channel === Channel.WHATSAPP && (code === 131047 || code === 131026)) {
    hints.push(
      'WhatsApp policy window/template restriction. Use an approved template when outside 24h window.',
    );
  }

  if (!hints.length) {
    hints.push(
      'Check channel token, recipient externalId, app mode (Live), and webhook subscription.',
    );
  }

  return { code, subcode, message, hints };
}

async function sendTestMessage({ channel, account, customerExternalId, text }) {
  if (channel === Channel.WHATSAPP) {
    if (!account.phoneNumberId) {
      throw new Error('Missing phoneNumberId in SocialAccount for WhatsApp');
    }
    const url = `https://graph.facebook.com/v19.0/${account.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: customerExternalId,
      type: 'text',
      text: { body: text },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${account.accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const bodyText = await res.text();
    let parsed = null;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = { raw: bodyText };
    }
    return { ok: res.ok, status: res.status, url, payload, response: parsed };
  }

  const urlObj = new URL('https://graph.facebook.com/v19.0/me/messages');
  urlObj.searchParams.set('access_token', account.accessToken);
  const payload = {
    recipient: { id: customerExternalId },
    messaging_type: 'RESPONSE',
    message: { text },
  };
  const res = await fetch(urlObj.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const bodyText = await res.text();
  let parsed = null;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    parsed = { raw: bodyText };
  }

  const redactedUrl = 'https://graph.facebook.com/v19.0/me/messages?access_token=<redacted>';
  return {
    ok: res.ok,
    status: res.status,
    url: redactedUrl,
    payload,
    response: parsed,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const conversationId = args.conversationId;
  const orgIdArg = args.orgId;
  const dryRun = args['dry-run'] === true || args.dryRun === true;
  const text =
    typeof args.text === 'string' && args.text.trim()
      ? args.text.trim()
      : `[INTRA delivery check] ${new Date().toISOString()}`;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  if (!conversationId) {
    throw new Error(
      'Missing --conversationId. Example: node scripts/catch-outbound-delivery-error.js --conversationId=abc123',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: String(conversationId),
        ...(orgIdArg ? { orgId: String(orgIdArg) } : {}),
      },
      include: { customer: true },
    });

    if (!conversation) {
      throw new Error('Conversation not found (or orgId mismatch)');
    }
    if (!conversation.customer) {
      throw new Error('Conversation has no linked customer');
    }

    const customer = conversation.customer;
    const channel = customer.source;
    if (
      !channel ||
      ![Channel.FACEBOOK_MESSENGER, Channel.INSTAGRAM, Channel.WHATSAPP].includes(
        channel,
      )
    ) {
      throw new Error(
        `Unsupported or missing customer channel: ${String(channel || 'null')}`,
      );
    }
    if (!customer.externalId) {
      throw new Error('Customer has no externalId (recipient id missing)');
    }

    // Prefer exact page match for FB/IG if available; fall back to any active channel account in org.
    let socialAccount = null;
    if (customer.pageId) {
      socialAccount = await prisma.socialAccount.findFirst({
        where: {
          orgId: conversation.orgId,
          channel,
          isActive: true,
          pageId: customer.pageId,
        },
      });
    }
    if (!socialAccount) {
      socialAccount = await prisma.socialAccount.findFirst({
        where: { orgId: conversation.orgId, channel, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
    }
    if (!socialAccount) {
      throw new Error(
        `No active SocialAccount found for org ${conversation.orgId} and channel ${channel}`,
      );
    }

    console.log('\n=== OUTBOUND DELIVERY DIAGNOSTICS ===');
    console.log('orgId:', conversation.orgId);
    console.log('conversationId:', conversation.id);
    console.log('customerId:', customer.id);
    console.log('channel:', channel);
    console.log('customerExternalId:', customer.externalId);
    console.log('customer.pageId:', customer.pageId || '<none>');
    console.log('socialAccount.id:', socialAccount.id);
    console.log('socialAccount.pageId:', socialAccount.pageId || '<none>');
    console.log(
      'socialAccount.accessToken:',
      redactToken(socialAccount.accessToken),
    );
    if (channel === Channel.WHATSAPP) {
      console.log(
        'socialAccount.phoneNumberId:',
        socialAccount.phoneNumberId || '<none>',
      );
    }

    if (dryRun) {
      console.log('\nDry-run mode: no message sent.');
      return;
    }

    const result = await sendTestMessage({
      channel,
      account: socialAccount,
      customerExternalId: customer.externalId,
      text,
    });

    console.log('\nRequest URL:', result.url);
    console.log('Request payload:', JSON.stringify(result.payload, null, 2));
    console.log('HTTP status:', result.status);
    console.log('Response:', JSON.stringify(result.response, null, 2));

    if (!result.ok) {
      const explained = explainMetaError(result.response, channel);
      console.error('\nDelivery test FAILED.');
      console.error('Meta code:', explained.code);
      console.error('Meta subcode:', explained.subcode);
      console.error('Meta message:', explained.message);
      console.error('Likely causes:');
      for (const hint of explained.hints) {
        console.error(`- ${hint}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log('\nDelivery test PASSED (Meta accepted the send request).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\nDiagnostics script failed:', err.message || err);
  process.exit(1);
});
