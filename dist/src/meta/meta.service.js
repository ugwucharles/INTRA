"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MetaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const routing_service_1 = require("../routing/routing.service");
const routing_settings_service_1 = require("../routing/routing-settings.service");
const auto_reply_service_1 = require("../auto-reply/auto-reply.service");
const socket_gateway_1 = require("../socket/socket.gateway");
const social_accounts_service_1 = require("../social-accounts/social-accounts.service");
let MetaService = MetaService_1 = class MetaService {
    prisma;
    routingService;
    routingSettingsService;
    autoReplyService;
    socketGateway;
    socialAccounts;
    logger = new common_1.Logger(MetaService_1.name);
    constructor(prisma, routingService, routingSettingsService, autoReplyService, socketGateway, socialAccounts) {
        this.prisma = prisma;
        this.routingService = routingService;
        this.routingSettingsService = routingSettingsService;
        this.autoReplyService = autoReplyService;
        this.socketGateway = socketGateway;
        this.socialAccounts = socialAccounts;
    }
    async handleWebhook(body) {
        this.logger.log(JSON.stringify({
            event: 'meta.webhook.received',
            object: (body && body.object) || null,
        }));
        if (!body || !body.object || !Array.isArray(body.entry)) {
            this.logger.warn('Ignoring unknown webhook payload');
            return;
        }
        for (const entry of body.entry) {
            if (body.object === 'whatsapp_business_account' && Array.isArray(entry.changes)) {
                for (const change of entry.changes) {
                    if (change.field === 'messages' && change.value) {
                        const phoneNumberId = change.value?.metadata?.phone_number_id;
                        let orgId = null;
                        if (phoneNumberId) {
                            const creds = await this.socialAccounts.findOrgByPhoneNumberId(phoneNumberId);
                            orgId = creds?.orgId ?? null;
                        }
                        if (!orgId) {
                            this.logger.warn(`No active WhatsApp SocialAccount for phone_number_id=${phoneNumberId ?? 'unknown'}; skipping`);
                            continue;
                        }
                        try {
                            await this.handleWhatsAppWebhookValue(orgId, change.value);
                        }
                        catch (err) {
                            this.logger.error('Failed to handle WhatsApp webhook value', err);
                        }
                    }
                }
                continue;
            }
            const pageId = entry.id;
            let orgId = null;
            if (pageId) {
                const creds = await this.socialAccounts.findOrgByPageId(pageId);
                orgId = creds?.orgId ?? null;
            }
            if (!orgId) {
                this.logger.warn(`No active SocialAccount for pageId=${pageId ?? 'unknown'}; skipping entry`);
                continue;
            }
            let messagingEvents = [];
            if (body.object === 'instagram' && Array.isArray(entry.changes)) {
                for (const change of entry.changes) {
                    if (change.field === 'messages' && change.value) {
                        messagingEvents.push(change.value);
                    }
                }
            }
            else {
                messagingEvents = entry.messaging ?? entry.standby ?? [];
            }
            if (!Array.isArray(messagingEvents) || messagingEvents.length === 0)
                continue;
            for (const event of messagingEvents) {
                try {
                    await this.handleMessagingEvent(body.object, orgId, event, pageId);
                }
                catch (err) {
                    this.logger.error('Failed to handle messaging event', err);
                }
            }
        }
    }
    async deleteCustomerData(orgId, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId,
            },
        });
        if (!customer) {
            this.logger.warn(`Requested delete for non-existent customer ${customerId} in org ${orgId}`);
            return { success: true };
        }
        await this.prisma.$transaction(async (tx) => {
            const conversations = await tx.conversation.findMany({
                where: {
                    orgId,
                    customerId: customer.id,
                },
                select: { id: true },
            });
            const conversationIds = conversations.map((c) => c.id);
            if (conversationIds.length > 0) {
                await tx.message.deleteMany({
                    where: { conversationId: { in: conversationIds } },
                });
                await tx.conversation.deleteMany({
                    where: { id: { in: conversationIds } },
                });
            }
            await tx.customer.delete({ where: { id: customer.id } });
        });
        this.logger.log(`Deleted Meta data for customer ${customerId} in org ${orgId}`);
        return { success: true };
    }
    async processOutboundJob(orgId, conversationId, customer, messageId, text) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
        });
        if (!message) {
            this.logger.warn(JSON.stringify({
                event: 'meta.outbound.skip',
                reason: 'missing_message',
                orgId,
                conversationId,
                messageId,
            }));
            return;
        }
        if (message.status !== client_1.MessageStatus.PENDING) {
            this.logger.warn(JSON.stringify({
                event: 'meta.outbound.skip',
                reason: 'not_pending',
                orgId,
                conversationId,
                messageId,
                status: message.status,
            }));
            return;
        }
        try {
            await this.sendOutboundTextMessage(orgId, conversationId, customer, text);
            await this.prisma.message.update({
                where: { id: messageId },
                data: {
                    status: client_1.MessageStatus.SENT,
                },
            });
            this.logger.log(JSON.stringify({
                event: 'meta.outbound.sent',
                orgId,
                conversationId,
                messageId,
                customerId: customer.id,
            }));
        }
        catch (err) {
            const newRetry = (message.retryCount ?? 0) + 1;
            await this.prisma.message.update({
                where: { id: messageId },
                data: {
                    retryCount: newRetry,
                    status: newRetry >= 3 ? client_1.MessageStatus.FAILED : client_1.MessageStatus.PENDING,
                },
            });
            this.logger.error(JSON.stringify({
                event: 'meta.outbound.error',
                orgId,
                conversationId,
                messageId,
                customerId: customer.id,
                retryCount: newRetry,
                error: err?.message ?? 'unknown',
            }));
            if (newRetry >= 3) {
                return;
            }
            throw err;
        }
    }
    async fetchMessengerName(orgId, psid) {
        const creds = await this.socialAccounts.findCredentials(orgId, client_1.$Enums.Channel.FACEBOOK_MESSENGER);
        const accessToken = creds?.accessToken;
        if (!accessToken) {
            return null;
        }
        try {
            const url = new URL(`https://graph.facebook.com/v19.0/${psid}`);
            url.searchParams.set('access_token', accessToken);
            url.searchParams.set('fields', 'name');
            const res = await fetch(url.toString());
            if (!res.ok) {
                return null;
            }
            const data = await res.json().catch(() => null);
            if (!data || typeof data.name !== 'string') {
                return null;
            }
            const trimmed = data.name.trim();
            return trimmed.length > 0 ? trimmed : null;
        }
        catch (err) {
            this.logger.error('Failed to fetch Messenger profile name', err);
            return null;
        }
    }
    async fetchInstagramName(orgId, igSenderId) {
        const creds = await this.socialAccounts.findCredentials(orgId, client_1.$Enums.Channel.INSTAGRAM);
        const accessToken = creds?.accessToken;
        if (!accessToken) {
            this.logger.warn(`No Instagram access token configured for org ${orgId}; cannot fetch Instagram profile name`);
            return null;
        }
        try {
            const url = new URL(`https://graph.facebook.com/v19.0/${igSenderId}`);
            url.searchParams.set('access_token', accessToken);
            url.searchParams.set('fields', 'name,username');
            const res = await fetch(url.toString());
            if (!res.ok) {
                const body = await res.text().catch(() => '');
                this.logger.warn(`Instagram profile fetch failed for sender ${igSenderId}: ${res.status} ${res.statusText} ${body}`);
                return null;
            }
            const data = await res.json().catch(() => null);
            if (!data) {
                return null;
            }
            const nameCandidate = (typeof data.name === 'string' && data.name.trim().length > 0
                ? data.name.trim()
                : null) ||
                (typeof data.username === 'string' && data.username.trim().length > 0
                    ? data.username.trim()
                    : null);
            return nameCandidate || null;
        }
        catch (err) {
            this.logger.error('Failed to fetch Instagram profile name', err);
            return null;
        }
    }
    async sendOutboundTextMessage(orgId, conversationId, customer, text) {
        if (!customer.source || !customer.externalId) {
            this.logger.warn('Cannot send Meta message: missing source or externalId');
            return;
        }
        if (customer.source === client_1.$Enums.Channel.WHATSAPP) {
            await this.sendWhatsAppTextMessage(orgId, conversationId, customer.id, customer.externalId, text);
            return;
        }
        const channel = customer.source === client_1.$Enums.Channel.INSTAGRAM
            ? client_1.$Enums.Channel.INSTAGRAM
            : client_1.$Enums.Channel.FACEBOOK_MESSENGER;
        const creds = await this.socialAccounts.findCredentials(orgId, channel);
        const pageAccessToken = creds?.accessToken;
        if (!pageAccessToken) {
            this.logger.error(`No ${channel} access token for org ${orgId}; cannot send outbound messages`);
            return;
        }
        const url = new URL('https://graph.facebook.com/v19.0/me/messages');
        url.searchParams.set('access_token', pageAccessToken);
        const payload = {
            recipient: { id: customer.externalId },
            messaging_type: 'RESPONSE',
            message: { text },
        };
        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                this.logger.error(`Failed to send Meta message for org ${orgId}, conversation ${conversationId}: ${response.status} ${response.statusText} ${errorText}`);
            }
            else {
                this.logger.log(`Sent Meta message for org ${orgId}, customer ${customer.id}, conversation ${conversationId}`);
            }
        }
        catch (err) {
            this.logger.error('Error while sending Meta message', err);
        }
    }
    async sendWhatsAppTextMessage(orgId, conversationId, customerId, toWaId, text) {
        const waCreds = await this.socialAccounts.findCredentials(orgId, client_1.$Enums.Channel.WHATSAPP);
        const phoneNumberId = waCreds?.phoneNumberId;
        const accessToken = waCreds?.accessToken;
        if (!phoneNumberId || !accessToken) {
            this.logger.error(`WhatsApp credentials not configured for org ${orgId}; cannot send WhatsApp message`);
            return;
        }
        const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
        const payload = {
            messaging_product: 'whatsapp',
            to: toWaId,
            type: 'text',
            text: { body: text },
        };
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                this.logger.error(`Failed to send WhatsApp message for org ${orgId}, conversation ${conversationId}: ${response.status} ${response.statusText} ${errorText}`);
            }
            else {
                this.logger.log(`Sent WhatsApp message for org ${orgId}, customer ${customerId}, conversation ${conversationId}`);
            }
        }
        catch (err) {
            this.logger.error('Error while sending WhatsApp message', err);
        }
    }
    async handleWhatsAppWebhookValue(orgId, value) {
        const messages = value.messages ?? [];
        const contacts = value.contacts ?? [];
        const nameByWaId = new Map();
        for (const contact of contacts) {
            const waId = contact.wa_id;
            const name = contact.profile?.name;
            if (waId && name) {
                nameByWaId.set(waId, name);
            }
        }
        for (const msg of messages) {
            if (msg.type !== 'text' || !msg.text?.body) {
                this.logger.log(`Ignoring non-text WhatsApp message (type=${msg.type})`);
                continue;
            }
            const waId = msg.from;
            if (!waId) {
                this.logger.warn('WhatsApp message missing sender wa_id');
                continue;
            }
            const text = msg.text.body;
            const externalId = msg.id;
            const rawTimestamp = typeof msg.timestamp === 'string' ? parseInt(msg.timestamp, 10) : msg.timestamp;
            const sentAt = typeof rawTimestamp === 'number' && !isNaN(rawTimestamp)
                ? new Date(rawTimestamp * 1000)
                : undefined;
            const displayName = nameByWaId.get(waId) ?? null;
            let customer = await this.prisma.customer.findFirst({
                where: { orgId, source: client_1.$Enums.Channel.WHATSAPP, externalId: waId },
            });
            if (!customer) {
                customer = await this.prisma.customer.create({
                    data: {
                        orgId,
                        source: client_1.$Enums.Channel.WHATSAPP,
                        externalId: waId,
                        phone: waId,
                        name: displayName,
                        isSaved: false,
                    },
                });
            }
            else if (displayName && customer.name !== displayName) {
                customer = await this.prisma.customer.update({
                    where: { id: customer.id },
                    data: { name: displayName },
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
                    data: { orgId, customerId: customer.id },
                });
            }
            const hadRoutingQuestionAlreadySent = !!conversation.routingQuestionSent;
            const isAwaitingRating = conversation.status === client_1.ConversationStatus.RESOLVED && conversation.awaitingRating;
            let message;
            try {
                message = await this.prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        senderType: client_1.SenderType.CUSTOMER,
                        senderId: waId,
                        content: text,
                        externalId: externalId,
                        ...(sentAt && { createdAt: sentAt }),
                    },
                });
            }
            catch (err) {
                if (err?.code === 'P2002') {
                    this.logger.warn(`Duplicate WhatsApp message ignored for conversation ${conversation.id}, externalId=${externalId}`);
                    continue;
                }
                throw err;
            }
            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    ...(sentAt && { updatedAt: sentAt }),
                    unreadCount: { increment: 1 },
                },
            });
            this.logger.log(JSON.stringify({
                event: 'whatsapp.inbound.stored',
                orgId,
                customerId: customer.id,
                conversationId: conversation.id,
                waId,
                externalId,
                createdAt: message.createdAt.toISOString(),
            }));
            this.socketGateway.emitToOrg(orgId, 'conversation_updated', {
                conversationId: conversation.id,
                lastMessage: text,
            });
            this.socketGateway.emitToConversation(conversation.id, 'new_message', message);
            if (isAwaitingRating) {
                await this.processRatingReply(orgId, conversation.id, conversation.resolvedBy, text);
                continue;
            }
            const settings = await this.routingSettingsService.getOrCreate(orgId);
            const settingsMeta = settings.metadata ?? {};
            const sendFirstMessage = settingsMeta.sendFirstMessage ?? true;
            const sendDepartmentQuestion = settingsMeta.sendDepartmentQuestion ?? true;
            const reaskOnInvalidSelection = settingsMeta.reaskOnInvalidSelection ?? true;
            const isAfterHours = this.computeIsAfterHours(settings);
            const totalMessages = await this.prisma.message.count({
                where: { conversationId: conversation.id },
            });
            const isFirstMessage = totalMessages === 1;
            try {
                const repliesToSend = [];
                if (isAfterHours) {
                    const afterHoursReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.AFTER_HOURS);
                    repliesToSend.push(...afterHoursReplies.map((r) => r.message));
                }
                if (isFirstMessage && sendFirstMessage) {
                    const firstReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.FIRST_MESSAGE);
                    repliesToSend.push(...firstReplies.map((r) => r.message));
                }
                if (sendDepartmentQuestion && !conversation.departmentId && !hadRoutingQuestionAlreadySent) {
                    const questionReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.DEPARTMENT_SELECTION);
                    if (questionReplies.length > 0) {
                        repliesToSend.push(...questionReplies.map((r) => r.message));
                        await this.prisma.conversation.update({
                            where: { id: conversation.id },
                            data: { routingQuestionSent: true },
                        });
                        conversation.routingQuestionSent = true;
                    }
                }
                for (const replyText of repliesToSend) {
                    await this.sendWhatsAppTextMessage(orgId, conversation.id, customer.id, waId, replyText);
                }
            }
            catch (err) {
                this.logger.error('WhatsApp auto-reply error', err);
            }
            try {
                const routingOutcome = hadRoutingQuestionAlreadySent
                    ? await this.routingService.handleInboundRouting({
                        orgId,
                        conversationId: conversation.id,
                        customerId: customer.id,
                        text,
                    })
                    : null;
                if (routingOutcome?.invalidSelection && reaskOnInvalidSelection && sendDepartmentQuestion) {
                    const questionReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.DEPARTMENT_SELECTION);
                    for (const reply of questionReplies) {
                        await this.sendWhatsAppTextMessage(orgId, conversation.id, customer.id, waId, reply.message);
                    }
                }
                if (routingOutcome?.noAgentAvailable) {
                    const noAgentReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.NO_AGENT_AVAILABLE, routingOutcome.departmentId);
                    for (const reply of noAgentReplies) {
                        await this.sendWhatsAppTextMessage(orgId, conversation.id, customer.id, waId, reply.message);
                    }
                }
            }
            catch (err) {
                this.logger.error('WhatsApp routing error', err);
            }
        }
    }
    async handleMessagingEvent(objectType, orgId, event, pageId) {
        if (!event.message || event.message.is_echo) {
            return;
        }
        const text = event.message.text;
        if (!text) {
            this.logger.log('Ignoring non-text message from Meta');
            return;
        }
        const senderId = event.sender?.id;
        if (!senderId) {
            this.logger.warn('Meta event without sender id');
            return;
        }
        const rawTimestamp = event.timestamp;
        const sentAt = typeof rawTimestamp === 'number' ? new Date(rawTimestamp) : undefined;
        const channel = objectType === 'instagram'
            ? client_1.$Enums.Channel.INSTAGRAM
            : client_1.$Enums.Channel.FACEBOOK_MESSENGER;
        let displayName = null;
        if (channel === client_1.$Enums.Channel.FACEBOOK_MESSENGER) {
            displayName = await this.fetchMessengerName(orgId, senderId);
        }
        else if (channel === client_1.$Enums.Channel.INSTAGRAM) {
            displayName = await this.fetchInstagramName(orgId, senderId);
        }
        let customer = await this.prisma.customer.findFirst({
            where: {
                orgId,
                source: channel,
                externalId: senderId,
            },
        });
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    orgId,
                    source: channel,
                    externalId: senderId,
                    pageId,
                    name: displayName,
                    email: null,
                    phone: null,
                    isSaved: false,
                },
            });
        }
        else if (displayName && customer.name !== displayName) {
            customer = await this.prisma.customer.update({
                where: { id: customer.id },
                data: { name: displayName },
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
                },
            });
        }
        const isAwaitingRating = conversation.status === client_1.ConversationStatus.RESOLVED && conversation.awaitingRating;
        const hadRoutingQuestionAlreadySent = !!conversation.routingQuestionSent;
        const mid = event.message.mid;
        let message;
        try {
            message = await this.prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderType: client_1.SenderType.CUSTOMER,
                    senderId,
                    content: text,
                    externalId: mid,
                    ...(sentAt && { createdAt: sentAt }),
                },
            });
        }
        catch (err) {
            if (err?.code === 'P2002') {
                this.logger.warn(`Duplicate Meta message ignored for conversation ${conversation.id}, externalId=${mid}`);
                return;
            }
            throw err;
        }
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                ...(sentAt && { updatedAt: sentAt }),
                unreadCount: { increment: 1 },
            },
        });
        this.logger.log(JSON.stringify({
            event: 'meta.inbound.stored',
            channel,
            orgId,
            customerId: customer.id,
            conversationId: conversation.id,
            senderId,
            externalId: mid,
            createdAt: message.createdAt.toISOString(),
        }));
        this.socketGateway.emitToOrg(orgId, 'conversation_updated', {
            conversationId: conversation.id,
            lastMessage: text,
        });
        this.socketGateway.emitToConversation(conversation.id, 'new_message', message);
        if (isAwaitingRating) {
            await this.processRatingReply(orgId, conversation.id, conversation.resolvedBy, text);
            return;
        }
        const settings = await this.routingSettingsService.getOrCreate(orgId);
        const settingsMeta = settings.metadata ?? {};
        const sendFirstMessage = settingsMeta.sendFirstMessage ?? true;
        const sendDepartmentQuestion = settingsMeta.sendDepartmentQuestion ?? true;
        const reaskOnInvalidSelection = settingsMeta.reaskOnInvalidSelection ?? true;
        const isAfterHours = this.computeIsAfterHours(settings);
        const totalMessages = await this.prisma.message.count({
            where: { conversationId: conversation.id },
        });
        const isFirstMessage = totalMessages === 1;
        try {
            const repliesToSend = [];
            if (isAfterHours) {
                const afterHoursReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.AFTER_HOURS);
                repliesToSend.push(...afterHoursReplies.map((r) => r.message));
            }
            if (isFirstMessage && sendFirstMessage) {
                const firstReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.FIRST_MESSAGE);
                repliesToSend.push(...firstReplies.map((r) => r.message));
            }
            if (sendDepartmentQuestion && !conversation.departmentId && !hadRoutingQuestionAlreadySent) {
                const questionReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.DEPARTMENT_SELECTION);
                if (questionReplies.length > 0) {
                    repliesToSend.push(...questionReplies.map((r) => r.message));
                    if (!conversation.routingQuestionSent) {
                        await this.prisma.conversation.update({
                            where: { id: conversation.id },
                            data: { routingQuestionSent: true },
                        });
                        conversation.routingQuestionSent = true;
                    }
                }
            }
            for (const replyText of repliesToSend) {
                await this.sendOutboundTextMessage(orgId, conversation.id, customer, replyText);
            }
        }
        catch (err) {
            this.logger.error('Auto-reply error', err);
        }
        try {
            const routingOutcome = hadRoutingQuestionAlreadySent
                ? await this.routingService.handleInboundRouting({
                    orgId,
                    conversationId: conversation.id,
                    customerId: customer.id,
                    text,
                })
                : null;
            if (routingOutcome?.invalidSelection && reaskOnInvalidSelection && sendDepartmentQuestion) {
                const questionReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.DEPARTMENT_SELECTION);
                for (const reply of questionReplies) {
                    await this.sendOutboundTextMessage(orgId, conversation.id, customer, reply.message);
                }
            }
            if (routingOutcome?.noAgentAvailable) {
                const noAgentReplies = await this.autoReplyService.getReplies(orgId, client_1.AutoReplyTrigger.NO_AGENT_AVAILABLE, routingOutcome.departmentId);
                for (const reply of noAgentReplies) {
                    await this.sendOutboundTextMessage(orgId, conversation.id, customer, reply.message);
                }
            }
        }
        catch (err) {
            this.logger.error('Routing error', err);
        }
    }
    async processRatingReply(orgId, conversationId, resolvedBy, text) {
        const trimmed = text.trim();
        const rating = Number.parseInt(trimmed, 10);
        if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
            this.logger.log(`Ignoring non-rating reply for conversation ${conversationId}: "${text}"`);
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
                    awaitingRating: false,
                    customerRating: rating,
                },
            });
            if (resolvedBy) {
                await tx.user.updateMany({
                    where: {
                        id: resolvedBy,
                        orgId,
                    },
                    data: {
                        ratingTotal: { increment: rating },
                        ratingCount: { increment: 1 },
                    },
                });
            }
        });
        this.logger.log(`Processed rating ${rating} for conversation ${conversationId} (org ${orgId})`);
    }
    computeIsAfterHours(settings) {
        const cfg = settings.afterHoursConfig ?? {};
        if (!cfg.enabled)
            return false;
        const openTime = cfg.openTime;
        const closeTime = cfg.closeTime;
        if (!openTime || !closeTime)
            return false;
        const timezone = cfg.timezone || 'UTC';
        try {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
            });
            const parts = formatter.formatToParts(now);
            const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
            const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
            const current = `${hour}:${minute}`;
            return current < openTime || current >= closeTime;
        }
        catch (err) {
            this.logger.error('Failed to compute after-hours state', err);
            return false;
        }
    }
};
exports.MetaService = MetaService;
exports.MetaService = MetaService = MetaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        routing_service_1.RoutingService,
        routing_settings_service_1.RoutingSettingsService,
        auto_reply_service_1.AutoReplyService,
        socket_gateway_1.SocketGateway,
        social_accounts_service_1.SocialAccountsService])
], MetaService);
//# sourceMappingURL=meta.service.js.map