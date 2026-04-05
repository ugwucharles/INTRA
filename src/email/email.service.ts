import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContext } from '../tenancy/tenant-context';
import { RoutingService } from '../routing/routing.service';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import * as nodemailer from 'nodemailer';
import { ConversationStatus, SenderType, MessageStatus } from '@prisma/client';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private imapClient: ImapFlow | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;
  // Tracks the highest UID we have already processed so we never miss emails
  // even if a mail client marks them as \Seen before we get to them.
  private lastProcessedUID: number = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly routingService: RoutingService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async onModuleInit() {
    this.initSmtp();
    // Don't await — run IMAP init in background so server boots immediately
    this.initImap().catch((err) => {
      this.logger.error('IMAP init failed (non-blocking)', err);
    });
  }

  async onModuleDestroy() {
    if (this.imapClient) {
      await this.imapClient.logout().catch(() => {});
    }
  }

  private initSmtp() {
    const host = process.env.EMAIL_SMTP_HOST;
    const port = parseInt(process.env.EMAIL_SMTP_PORT || '465', 10);
    const user = process.env.EMAIL_ADDRESS;
    const pass = process.env.EMAIL_PASSWORD;

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP credentials missing from .env. Outbound email is disabled.',
      );
      return;
    }

    this.smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.smtpTransporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP Connection Error:', error);
      } else {
        this.logger.log(`SMTP initialized and verified for ${user}`);
      }
    });
  }

  private async initImap() {
    const host = process.env.EMAIL_IMAP_HOST;
    const port = parseInt(process.env.EMAIL_IMAP_PORT || '993', 10);
    const user = process.env.EMAIL_ADDRESS;
    const pass = process.env.EMAIL_PASSWORD;

    if (!host || !user || !pass) {
      this.logger.warn(
        'IMAP credentials missing from .env. Inbound email is disabled.',
      );
      return;
    }

    while (true) {
      // Create a fresh client on every connection attempt — ImapFlow cannot be reused after disconnect
      this.imapClient = new ImapFlow({
        host,
        port,
        secure: port === 993,
        auth: { user, pass },
        logger: false, // Set to true for debugging connection issues
      });

      // CRITICAL: Handle the 'error' event to prevent the process from crashing on timeouts
      this.imapClient.on('error', (err) => {
        this.logger.error('IMAP Runtime Error:', err);
      });

      try {
        this.logger.log(`Attempting IMAP connection for ${user}...`);
        await this.imapClient.connect();
        this.logger.log(`IMAP connected and authenticated for ${user}`);

        // Select the INBOX and start listening
        const mailboxStatus = await this.imapClient.mailboxOpen('INBOX');
        this.logger.log(
          'IMAP INBOX opened. Restoring high-water mark from DB...',
        );

        const storedUID = await this.loadLastProcessedUID();
        const uidNext = (mailboxStatus as any).uidNext ?? 1;

        // If our stored high-water mark is >= uidNext the mailbox was deleted/recreated
        // and UIDs have reset. Start from scratch to avoid silently skipping all emails.
        if (storedUID >= uidNext) {
          this.logger.warn(
            `Stored UID (${storedUID}) >= mailbox uidNext (${uidNext}). Mailbox may have been recreated — starting fresh.`,
          );
          this.lastProcessedUID = 0;
        } else {
          this.lastProcessedUID = storedUID;
        }
        this.logger.log(
          `Resuming from last processed UID: ${this.lastProcessedUID}`,
        );

        // Fetch any emails we may have missed while the server was offline
        await this.fetchUnreadEmails();

        // Listen for new emails arriving while the connection is alive
        const existsHandler = (data: { count: number }) =>
          this.handleNewEmailCount(data.count);
        this.imapClient.on('exists', existsHandler);

        this.logger.log('IMAP Listening for new emails (Idle)...');

        // Fallback polling every 1 minute in case IDLE fails or is missed
        let pollingInterval: ReturnType<typeof setInterval> | null =
          setInterval(() => {
            this.logger.debug('Running fallback email polling...');
            this.fetchUnreadEmails().catch((err) =>
              this.logger.error('Fallback polling failed', err),
            );
          }, 60000);

        // Wait until the connection closes or errors out
        await new Promise((resolve) => {
          this.imapClient?.once('close', () => {
            this.logger.warn('IMAP connection closed.');
            resolve(null);
          });
          // Also resolve on error so we can retry
          this.imapClient?.once('error', () => resolve(null));
        });

        // Clean up interval and listener before retrying
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        this.imapClient.off('exists', existsHandler);
      } catch (err) {
        this.logger.error(
          'IMAP Connection Loop Error. Retrying in 10s...',
          err,
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } finally {
        // Ensure we try to logout/close cleanly before reconnecting
        if (this.imapClient) {
          await this.imapClient.logout().catch(() => {});
          this.imapClient = null;
        }
      }
    }
  }

  private async fetchUnreadEmails() {
    if (!this.imapClient) return;

    this.logger.log(`Fetching emails with UID > ${this.lastProcessedUID}...`);
    try {
      // Fetch ALL emails newer than the last one we processed.
      // This is UID-based so it works even if a mail client has marked emails as \Seen.
      const range =
        this.lastProcessedUID > 0 ? `${this.lastProcessedUID + 1}:*` : '1:*';

      const fetcher = this.imapClient.fetch(
        range,
        { source: true, uid: true },
        { uid: true },
      );
      const toProcess: { uid: number; source: Buffer }[] = [];

      for await (const message of fetcher) {
        if (
          message.source &&
          message.uid &&
          message.uid > this.lastProcessedUID
        ) {
          toProcess.push({
            uid: message.uid,
            source: message.source,
          });
        }
      }

      if (toProcess.length === 0) {
        this.logger.log('No new emails to process.');
        return;
      }

      this.logger.log(`Found ${toProcess.length} new email(s). Processing...`);

      for (const { uid, source } of toProcess) {
        this.logger.log(`Processing email UID: ${uid}`);
        await this.processIncomingEmail(source, uid);
        // Advance the in-memory high-water mark (DB is updated inside processIncomingEmail)
        if (uid > this.lastProcessedUID) {
          this.lastProcessedUID = uid;
        }
      }

      this.logger.log(
        `Finished processing ${toProcess.length} email(s). Last UID: ${this.lastProcessedUID}.`,
      );
    } catch (err) {
      this.logger.error('Failed to fetch emails', err);
    }
  }

  private async handleNewEmailCount(count: number) {
    this.logger.log(
      `IMAP 'exists' event triggered. Total messages in INBOX: ${count}. Checking for unread...`,
    );
    await this.fetchUnreadEmails();
  }

  private async loadLastProcessedUID(): Promise<number> {
    try {
      // Fetch the highest UID across ALL orgs so no email is missed.
      // Each email is routed to the correct org in processIncomingEmail.
      const latest = await TenantContext.run(
        { bypassTenantEnforcement: true },
        () =>
          this.prisma.message.findFirst({
            where: {
              senderType: SenderType.CUSTOMER,
              externalId: { not: null },
              conversation: {
                customer: { source: 'EMAIL' as any },
              },
            },
            orderBy: { createdAt: 'desc' },
            select: { externalId: true },
          }),
      );
      if (latest?.externalId) {
        const uid = parseInt(latest.externalId, 10);
        if (!isNaN(uid) && uid > 0) return uid;
      }
    } catch (err) {
      this.logger.error('Failed to load last processed email UID from DB', err);
    }
    return 0;
  }

  private async processIncomingEmail(rawSource: Buffer, uid: number) {
    try {
      const parsed = await simpleParser(rawSource);

      const fromAddress = parsed.from?.value[0]?.address;
      const fromName = parsed.from?.value[0]?.name;
      const subject = parsed.subject || 'No Subject';
      const text = (parsed.text || parsed.html || '[No Content]').trim();

      if (!fromAddress) {
        this.logger.warn(
          'Could not extract sender address from email. Skipping.',
        );
        return;
      }

      this.logger.log(`Parsed email from: ${fromAddress} Subject: ${subject}`);

      // Resolve the org that owns this email address.
      // Look up a SocialAccount with channel EMAIL whose accessToken (used to store
      // the email address for the EMAIL channel) matches the recipient. If none
      // found, fall back to the EMAIL_ORG_ID env var for single-org deployments.
      const recipientEmail = process.env.EMAIL_ADDRESS?.toLowerCase().trim();
      let orgId: string | undefined;

      if (recipientEmail) {
        const emailAccount = await TenantContext.run(
          { bypassTenantEnforcement: true },
          () =>
            this.prisma.socialAccount.findFirst({
              where: { channel: 'EMAIL' as any, isActive: true },
              select: { orgId: true },
            }),
        );
        orgId = emailAccount?.orgId;
      }

      // Fallback: use explicit env var or first org (for single-tenant setups)
      if (!orgId) {
        orgId = process.env.EMAIL_ORG_ID;
      }
      if (!orgId) {
        // Last resort: find the first org. This should be replaced with proper
        // per-org email routing in production multi-tenant deployments.
        const org = await TenantContext.run(
          { bypassTenantEnforcement: true },
          () => this.prisma.organization.findFirst(),
        );
        if (!org) {
          this.logger.warn(
            'No organization found in database for incoming email',
          );
          return;
        }
        orgId = org.id;
        this.logger.warn(
          `Email routing: no SocialAccount or EMAIL_ORG_ID configured. ` +
            `Falling back to first org (${orgId}). Configure per-org email routing for multi-tenant.`,
        );
      }

      // 1. Find or create customer
      let customer = await this.prisma.customer.findFirst({
        where: { orgId, email: fromAddress, source: 'EMAIL' as any },
      });

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            orgId,
            email: fromAddress,
            name: fromName || fromAddress.split('@')[0],
            source: 'EMAIL' as any,
            isSaved: false,
          },
        });
      }

      // 2. Find open conversation or a RESOLVED one waiting for rating; otherwise create a new one
      let conversation = await this.prisma.conversation.findFirst({
        where: {
          orgId,
          customerId: customer.id,
          OR: [
            { status: ConversationStatus.OPEN },
            { status: ConversationStatus.RESOLVED, awaitingRating: true },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!conversation) {
        conversation = await this.prisma.conversation.create({
          data: {
            orgId,
            customerId: customer.id,
            status: ConversationStatus.OPEN,
            routingMetadata: { emailSubject: subject },
          },
        });
      } else {
        // Update subject to the latest email received on this conversation
        await this.prisma.conversation.updateMany({
          where: { id: conversation.id, orgId },
          data: { routingMetadata: { emailSubject: subject } },
        });
        const refreshed = await this.prisma.conversation.findFirst({
          where: { id: conversation.id, orgId },
        });
        if (refreshed) {
          conversation = refreshed;
        }
      }

      if (!conversation) {
        this.logger.warn(`Conversation missing after upsert (orgId=${orgId})`);
        return;
      }
      const isAwaitingRating =
        conversation.status === ConversationStatus.RESOLVED &&
        conversation.awaitingRating;

      // 3. Create the message — externalId is the IMAP UID, used for idempotency
      // so that even if this email is re-fetched (e.g. after a restart) we never
      // insert a duplicate. This is the same pattern used by the Meta/WhatsApp service.
      const prefix =
        subject && subject !== 'No Subject' ? `[Subject: ${subject}]\n` : '';
      const messageContent = prefix + text;

      let message;
      try {
        message = await this.prisma.message.create({
          data: {
            orgId,
            conversationId: conversation.id,
            senderType: SenderType.CUSTOMER,
            content: messageContent,
            status: MessageStatus.SENT,
            externalId: String(uid),
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          this.logger.warn(
            `Duplicate email skipped (UID=${uid}, conversationId=${conversation.id})`,
          );
          return;
        }
        throw err;
      }

      // 4. Update conversation timestamp and unread count
      await this.prisma.conversation.updateMany({
        where: { id: conversation.id, orgId },
        data: { updatedAt: new Date(), unreadCount: { increment: 1 } },
      });
      let updatedConversation = await this.prisma.conversation.findFirst({
        where: { id: conversation.id, orgId },
        include: { customer: true },
      });
      if (!updatedConversation) {
        this.logger.warn(
          `Conversation disappeared during email ingest (id=${conversation.id}, orgId=${orgId})`,
        );
        return;
      }

      // If this conversation is awaiting a customer rating, process it and skip routing.
      if (isAwaitingRating) {
        await this.processRatingReply(
          orgId,
          conversation.id,
          conversation.resolvedBy,
          text,
        );

        // Refresh updatedConversation to include the new rating and new status (CLOSED) so the UI updates instantly
        const refreshed = await this.prisma.conversation.findFirst({
          where: { id: conversation.id, orgId },
          include: { customer: true },
        });
        if (refreshed) {
          updatedConversation = refreshed;
        }
      } else {
        // 5. Trigger routing if it's unassigned
        if (!conversation.departmentId && !conversation.assignedTo) {
          await this.routingService.handleInboundRouting({
            orgId,
            conversationId: conversation.id,
            customerId: customer.id,
            text: messageContent,
          });
        }
      }

      this.logger.log(
        `Processed inbound email from ${fromAddress}. Emitting via WebSocket to org: ${orgId}`,
      );

      // 6. Emit real-time update via WebSocket — include full conversation+customer so the
      //    dashboard can update state instantly without making any API calls.
      try {
        if (!orgId) {
          this.logger.error('No orgId found to emit WebSocket event');
          return;
        }
        this.socketGateway.emitToOrg(orgId, 'conversation_updated', {
          conversationId: conversation.id,
          customerId: customer.id,
          lastMessage: messageContent,
          conversation: updatedConversation,
        });
        this.socketGateway.emitToConversation(
          conversation.id,
          'new_message',
          message,
          orgId,
        );
        this.logger.log(
          `Successfully emitted WebSocket events for conversation: ${conversation.id}`,
        );
      } catch (err) {
        this.logger.error('Failed to emit WebSocket event', err);
      }
    } catch (err) {
      this.logger.error('Error processing incoming email', err);
    }
  }

  private extractRatingFromEmailText(text: string): number | null {
    const lines = text.replace(/\r/g, '').split('\n');

    // Take the first meaningful non-quoted line (customer's fresh reply usually appears first).
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('>')) continue;
      if (/^On .+wrote:$/i.test(line)) break;

      const exact = line.match(/^([1-9]|10)$/);
      if (exact) return Number.parseInt(exact[1], 10);

      const firstToken = line.match(/^([1-9]|10)\b/);
      if (firstToken) return Number.parseInt(firstToken[1], 10);

      break;
    }

    return null;
  }

  private async processRatingReply(
    orgId: string,
    conversationId: string,
    resolvedBy: string | null,
    text: string,
  ): Promise<void> {
    const rating = this.extractRatingFromEmailText(text);
    if (!rating) {
      this.logger.log(
        `Ignoring non-rating email reply for conversation ${conversationId}: "${text.slice(0, 120)}"`,
      );
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.conversation.updateMany({
        where: {
          id: conversationId,
          orgId,
          awaitingRating: true,
        },
        data: {
          status: ConversationStatus.CLOSED,
          awaitingRating: false,
          customerRating: rating,
        },
      });

      // 1. Update the staff member's rating stats if they were assigned
      if (resolvedBy) {
        await tx.user.updateMany({
          where: { id: resolvedBy, orgId },
          data: {
            ratingTotal: { increment: rating },
            ratingCount: { increment: 1 },
          },
        });
      }
    });

    this.logger.log(
      `Processed email rating ${rating} for conversation ${conversationId} and permanently deleted the conversation.`,
    );
  }
  /**
   * Outbound sending for replies from Dashboard
   */
  async sendReply(
    orgId: string,
    conversationId: string,
    toEmail: string,
    text: string,
    messageId: string,
  ) {
    if (!this.smtpTransporter) {
      this.logger.error('Cannot send email reply: SMTP is not configured');
      return;
    }

    this.logger.log(`Attempting to send outbound email to ${toEmail}...`);

    // Retrieve the original subject stored when the inbound email was processed
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId },
      select: { routingMetadata: true },
    });
    const meta = conv?.routingMetadata as Record<string, any> | null;
    const originalSubject = meta?.emailSubject as string | undefined;
    const replySubject = originalSubject
      ? `Re: ${originalSubject}`
      : 'Re: Your message';

    try {
      await this.smtpTransporter.sendMail({
        from: process.env.EMAIL_ADDRESS,
        to: toEmail,
        subject: replySubject,
        text,
      });

      this.logger.log(`Outbound email successfully sent to ${toEmail}`);

      await this.prisma.message.updateMany({
        where: { id: messageId, orgId },
        data: { status: MessageStatus.SENT },
      });

      this.logger.log(`Sent outbound email reply to ${toEmail}`);
    } catch (err: any) {
      this.logger.error(`Failed to send outbound email: ${err.message}`);
      await this.prisma.message.updateMany({
        where: { id: messageId, orgId },
        data: { status: MessageStatus.FAILED },
      });
    }
  }
}
