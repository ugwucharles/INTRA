"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const routing_service_1 = require("../routing/routing.service");
const imapflow_1 = require("imapflow");
const mailparser_1 = require("mailparser");
const nodemailer = __importStar(require("nodemailer"));
const client_1 = require("@prisma/client");
const socket_gateway_1 = require("../socket/socket.gateway");
let EmailService = EmailService_1 = class EmailService {
    prisma;
    routingService;
    socketGateway;
    logger = new common_1.Logger(EmailService_1.name);
    imapClient = null;
    smtpTransporter = null;
    lastProcessedUID = 0;
    constructor(prisma, routingService, socketGateway) {
        this.prisma = prisma;
        this.routingService = routingService;
        this.socketGateway = socketGateway;
    }
    async onModuleInit() {
        this.initSmtp();
        this.initImap().catch((err) => {
            this.logger.error('IMAP init failed (non-blocking)', err);
        });
    }
    async onModuleDestroy() {
        if (this.imapClient) {
            await this.imapClient.logout().catch(() => { });
        }
    }
    initSmtp() {
        const host = process.env.EMAIL_SMTP_HOST;
        const port = parseInt(process.env.EMAIL_SMTP_PORT || '465', 10);
        const user = process.env.EMAIL_ADDRESS;
        const pass = process.env.EMAIL_PASSWORD;
        if (!host || !user || !pass) {
            this.logger.warn('SMTP credentials missing from .env. Outbound email is disabled.');
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
            }
            else {
                this.logger.log(`SMTP initialized and verified for ${user}`);
            }
        });
    }
    async initImap() {
        const host = process.env.EMAIL_IMAP_HOST;
        const port = parseInt(process.env.EMAIL_IMAP_PORT || '993', 10);
        const user = process.env.EMAIL_ADDRESS;
        const pass = process.env.EMAIL_PASSWORD;
        if (!host || !user || !pass) {
            this.logger.warn('IMAP credentials missing from .env. Inbound email is disabled.');
            return;
        }
        while (true) {
            this.imapClient = new imapflow_1.ImapFlow({
                host,
                port,
                secure: port === 993,
                auth: { user, pass },
                logger: false,
            });
            this.imapClient.on('error', (err) => {
                this.logger.error('IMAP Runtime Error:', err);
            });
            try {
                this.logger.log(`Attempting IMAP connection for ${user}...`);
                await this.imapClient.connect();
                this.logger.log(`IMAP connected and authenticated for ${user}`);
                const mailboxStatus = await this.imapClient.mailboxOpen('INBOX');
                this.logger.log('IMAP INBOX opened. Restoring high-water mark from DB...');
                const storedUID = await this.loadLastProcessedUID();
                const uidNext = mailboxStatus.uidNext ?? 1;
                if (storedUID >= uidNext) {
                    this.logger.warn(`Stored UID (${storedUID}) >= mailbox uidNext (${uidNext}). Mailbox may have been recreated — starting fresh.`);
                    this.lastProcessedUID = 0;
                }
                else {
                    this.lastProcessedUID = storedUID;
                }
                this.logger.log(`Resuming from last processed UID: ${this.lastProcessedUID}`);
                await this.fetchUnreadEmails();
                const existsHandler = (data) => this.handleNewEmailCount(data.count);
                this.imapClient.on('exists', existsHandler);
                this.logger.log('IMAP Listening for new emails (Idle)...');
                let pollingInterval = setInterval(() => {
                    this.logger.debug('Running fallback email polling...');
                    this.fetchUnreadEmails().catch(err => this.logger.error('Fallback polling failed', err));
                }, 60000);
                await new Promise((resolve) => {
                    this.imapClient?.once('close', () => {
                        this.logger.warn('IMAP connection closed.');
                        resolve(null);
                    });
                    this.imapClient?.once('error', () => resolve(null));
                });
                if (pollingInterval) {
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }
                this.imapClient.off('exists', existsHandler);
            }
            catch (err) {
                this.logger.error('IMAP Connection Loop Error. Retrying in 10s...', err);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            finally {
                if (this.imapClient) {
                    await this.imapClient.logout().catch(() => { });
                    this.imapClient = null;
                }
            }
        }
    }
    async fetchUnreadEmails() {
        if (!this.imapClient)
            return;
        this.logger.log(`Fetching emails with UID > ${this.lastProcessedUID}...`);
        try {
            const range = this.lastProcessedUID > 0
                ? `${this.lastProcessedUID + 1}:*`
                : '1:*';
            const fetcher = this.imapClient.fetch(range, { source: true, uid: true }, { uid: true });
            const toProcess = [];
            for await (const message of fetcher) {
                if (message.source && message.uid && message.uid > this.lastProcessedUID) {
                    toProcess.push({ uid: message.uid, source: message.source });
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
                if (uid > this.lastProcessedUID) {
                    this.lastProcessedUID = uid;
                }
            }
            this.logger.log(`Finished processing ${toProcess.length} email(s). Last UID: ${this.lastProcessedUID}.`);
        }
        catch (err) {
            this.logger.error('Failed to fetch emails', err);
        }
    }
    async handleNewEmailCount(count) {
        this.logger.log(`IMAP 'exists' event triggered. Total messages in INBOX: ${count}. Checking for unread...`);
        await this.fetchUnreadEmails();
    }
    async loadLastProcessedUID() {
        try {
            const org = await this.prisma.organization.findFirst();
            if (!org)
                return 0;
            const orgId = org.id;
            const latest = await this.prisma.message.findFirst({
                where: {
                    senderType: client_1.SenderType.CUSTOMER,
                    externalId: { not: null },
                    conversation: {
                        customer: { source: 'EMAIL', orgId },
                    },
                },
                orderBy: { createdAt: 'desc' },
                select: { externalId: true },
            });
            if (latest?.externalId) {
                const uid = parseInt(latest.externalId, 10);
                if (!isNaN(uid) && uid > 0)
                    return uid;
            }
        }
        catch (err) {
            this.logger.error('Failed to load last processed email UID from DB', err);
        }
        return 0;
    }
    async processIncomingEmail(rawSource, uid) {
        try {
            const parsed = await (0, mailparser_1.simpleParser)(rawSource);
            const fromAddress = parsed.from?.value[0]?.address;
            const fromName = parsed.from?.value[0]?.name;
            const subject = parsed.subject || 'No Subject';
            const text = (parsed.text || parsed.html || '[No Content]').trim();
            if (!fromAddress) {
                this.logger.warn('Could not extract sender address from email. Skipping.');
                return;
            }
            this.logger.log(`Parsed email from: ${fromAddress} Subject: ${subject}`);
            const org = await this.prisma.organization.findFirst();
            if (!org) {
                this.logger.warn('No organization found in database for incoming email');
                return;
            }
            const orgId = org.id;
            let customer = await this.prisma.customer.findFirst({
                where: { orgId, email: fromAddress, source: 'EMAIL' },
            });
            if (!customer) {
                customer = await this.prisma.customer.create({
                    data: {
                        orgId,
                        email: fromAddress,
                        name: fromName || fromAddress.split('@')[0],
                        source: 'EMAIL',
                        isSaved: false,
                    },
                });
            }
            let conversation = await this.prisma.conversation.findFirst({
                where: {
                    orgId,
                    customerId: customer.id,
                    OR: [
                        { status: client_1.ConversationStatus.OPEN },
                        { status: client_1.ConversationStatus.RESOLVED, awaitingRating: true },
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
            if (!conversation) {
                conversation = await this.prisma.conversation.create({
                    data: {
                        orgId,
                        customerId: customer.id,
                        status: client_1.ConversationStatus.OPEN,
                        routingMetadata: { emailSubject: subject },
                    },
                });
            }
            else {
                conversation = await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { routingMetadata: { emailSubject: subject } },
                });
            }
            const isAwaitingRating = conversation.status === client_1.ConversationStatus.RESOLVED && conversation.awaitingRating;
            const prefix = subject && subject !== 'No Subject' ? `[Subject: ${subject}]\n` : '';
            const messageContent = prefix + text;
            let message;
            try {
                message = await this.prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderType: client_1.SenderType.CUSTOMER,
                        content: messageContent,
                        status: client_1.MessageStatus.SENT,
                        externalId: String(uid),
                    },
                });
            }
            catch (err) {
                if (err?.code === 'P2002') {
                    this.logger.warn(`Duplicate email skipped (UID=${uid}, conversationId=${conversation.id})`);
                    return;
                }
                throw err;
            }
            let updatedConversation = await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date(), unreadCount: { increment: 1 } },
                include: { customer: true },
            });
            if (isAwaitingRating) {
                await this.processRatingReply(orgId, conversation.id, conversation.resolvedBy, text);
                const refreshed = await this.prisma.conversation.findUnique({
                    where: { id: conversation.id },
                    include: { customer: true },
                });
                if (refreshed) {
                    updatedConversation = refreshed;
                }
            }
            else {
                if (!conversation.departmentId && !conversation.assignedTo) {
                    await this.routingService.handleInboundRouting({
                        orgId,
                        conversationId: conversation.id,
                        customerId: customer.id,
                        text: messageContent,
                    });
                }
            }
            this.logger.log(`Processed inbound email from ${fromAddress}. Emitting via WebSocket to org: ${orgId}`);
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
                this.socketGateway.emitToConversation(conversation.id, 'new_message', message);
                this.logger.log(`Successfully emitted WebSocket events for conversation: ${conversation.id}`);
            }
            catch (err) {
                this.logger.error('Failed to emit WebSocket event', err);
            }
        }
        catch (err) {
            this.logger.error('Error processing incoming email', err);
        }
    }
    extractRatingFromEmailText(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line)
                continue;
            if (line.startsWith('>'))
                continue;
            if (/^On .+wrote:$/i.test(line))
                break;
            const exact = line.match(/^([1-9]|10)$/);
            if (exact)
                return Number.parseInt(exact[1], 10);
            const firstToken = line.match(/^([1-9]|10)\b/);
            if (firstToken)
                return Number.parseInt(firstToken[1], 10);
            break;
        }
        return null;
    }
    async processRatingReply(orgId, conversationId, resolvedBy, text) {
        const rating = this.extractRatingFromEmailText(text);
        if (!rating) {
            this.logger.log(`Ignoring non-rating email reply for conversation ${conversationId}: "${text.slice(0, 120)}"`);
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
                    status: client_1.ConversationStatus.CLOSED,
                    awaitingRating: false,
                    customerRating: rating,
                },
            });
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
        this.logger.log(`Processed email rating ${rating} for conversation ${conversationId} and permanently deleted the conversation.`);
    }
    async sendReply(orgId, conversationId, toEmail, text, messageId) {
        if (!this.smtpTransporter) {
            this.logger.error('Cannot send email reply: SMTP is not configured');
            return;
        }
        this.logger.log(`Attempting to send outbound email to ${toEmail}...`);
        const conv = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { routingMetadata: true },
        });
        const meta = conv?.routingMetadata;
        const originalSubject = meta?.emailSubject;
        const replySubject = originalSubject ? `Re: ${originalSubject}` : 'Re: Your message';
        try {
            await this.smtpTransporter.sendMail({
                from: process.env.EMAIL_ADDRESS,
                to: toEmail,
                subject: replySubject,
                text,
            });
            this.logger.log(`Outbound email successfully sent to ${toEmail}`);
            await this.prisma.message.update({
                where: { id: messageId },
                data: { status: client_1.MessageStatus.SENT },
            });
            this.logger.log(`Sent outbound email reply to ${toEmail}`);
        }
        catch (err) {
            this.logger.error(`Failed to send outbound email: ${err.message}`);
            await this.prisma.message.update({
                where: { id: messageId },
                data: { status: client_1.MessageStatus.FAILED },
            });
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        routing_service_1.RoutingService,
        socket_gateway_1.SocketGateway])
], EmailService);
//# sourceMappingURL=email.service.js.map