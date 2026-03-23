"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
async function testImap() {
    const host = process.env.EMAIL_IMAP_HOST;
    const port = parseInt(process.env.EMAIL_IMAP_PORT || '993', 10);
    const user = process.env.EMAIL_ADDRESS;
    const pass = process.env.EMAIL_PASSWORD;
    console.log('\n--- IMAP Diagnostic ---');
    console.log(`Host : ${host}:${port}`);
    console.log(`User : ${user}`);
    console.log(`Pass : ${'*'.repeat((pass || '').length)}`);
    console.log('-----------------------\n');
    if (!host || !user || !pass) {
        console.error('Missing IMAP credentials in .env');
        process.exit(1);
    }
    const client = new imapflow_1.ImapFlow({
        host,
        port,
        secure: port === 993,
        auth: { user, pass },
        logger: false,
    });
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('Connected successfully!\n');
        const mailbox = await client.mailboxOpen('INBOX');
        const totalMessages = mailbox.exists ?? 0;
        const status = await client.status('INBOX', { messages: true, unseen: true });
        const totalCount = status.messages ?? 0;
        const unseenCount2 = status.unseen ?? 0;
        console.log(`INBOX status: ${totalCount} total, ${unseenCount2} unseen\n`);
        if (totalCount === 0) {
            console.log('Inbox is empty.');
            return;
        }
        const fetchRange = totalCount > 5
            ? `${totalCount - 4}:${totalCount}`
            : `1:${totalCount}`;
        console.log(`Fetching last ${Math.min(5, totalCount)} messages (including already-read ones):\n`);
        const fetcher = client.fetch(fetchRange, { source: true, uid: true, flags: true });
        let index = 1;
        for await (const msg of fetcher) {
            if (!msg.source) {
                console.log(`[${index}] UID: ${msg.uid} — no source content`);
                index++;
                continue;
            }
            const parsed = await (0, mailparser_1.simpleParser)(msg.source);
            const from = parsed.from?.value?.[0]?.address ?? 'unknown';
            const subject = parsed.subject ?? '(no subject)';
            const date = parsed.date?.toISOString() ?? 'unknown';
            const flags = msg.flags ?? new Set();
            const isSeen = flags.has('\\Seen');
            console.log(`[${index}] UID: ${msg.uid}`);
            console.log(`    From    : ${from}`);
            console.log(`    Subject : ${subject}`);
            console.log(`    Date    : ${date}`);
            console.log(`    Seen    : ${isSeen ? 'YES (server will skip this)' : 'NO  (server will process this)'}`);
            console.log('');
            index++;
        }
        console.log('--- Unseen (unread) messages only ---');
        const unseenFetcher = client.fetch({ seen: false }, { uid: true, flags: true });
        let unseenCount = 0;
        for await (const msg of unseenFetcher) {
            unseenCount++;
            const flags = msg.flags ?? new Set();
            console.log(`  Unseen UID: ${msg.uid}, Flags: ${[...flags].join(', ') || 'none'}`);
        }
        if (unseenCount === 0) {
            console.log('  No unseen messages found — this is why no emails are being processed!');
            console.log('  Your test email was likely already opened/read in another mail client.');
        }
    }
    catch (err) {
        console.error('IMAP Error:', err);
    }
    finally {
        await client.logout().catch(() => { });
        console.log('\nDone.');
    }
}
testImap();
//# sourceMappingURL=test-imap.js.map