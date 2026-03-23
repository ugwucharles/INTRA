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
var MessagesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const meta_service_1 = require("../meta/meta.service");
const email_service_1 = require("../email/email.service");
const socket_gateway_1 = require("../socket/socket.gateway");
let MessagesService = MessagesService_1 = class MessagesService {
    prisma;
    metaService;
    emailService;
    socketGateway;
    logger = new common_1.Logger(MessagesService_1.name);
    constructor(prisma, metaService, emailService, socketGateway) {
        this.prisma = prisma;
        this.metaService = metaService;
        this.emailService = emailService;
        this.socketGateway = socketGateway;
    }
    async createMessage(currentUser, conversationId, dto) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                orgId: currentUser.orgId,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        if (conversation.status === client_1.ConversationStatus.CLOSED ||
            conversation.status === client_1.ConversationStatus.RESOLVED) {
            throw new common_1.ForbiddenException('Cannot send messages on a closed or resolved conversation');
        }
        const isAssignedToSomeone = !!conversation.assignedTo;
        const isCurrentAssignee = conversation.assignedTo === currentUser.userId;
        if (isAssignedToSomeone && !isCurrentAssignee) {
            throw new common_1.ForbiddenException('Only the assigned agent can send messages on this conversation');
        }
        if (!isAssignedToSomeone && currentUser.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('Only an admin can send messages on an unassigned conversation');
        }
        const message = await this.prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderType: client_1.SenderType.STAFF,
                senderId: currentUser.userId,
                content: dto.content,
            },
        });
        if (conversation.firstResponseTime === null) {
            const secondsDiff = Math.floor((Date.now() - conversation.createdAt.getTime()) / 1000);
            await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { firstResponseTime: secondsDiff },
            });
        }
        try {
            const fullConversation = await this.prisma.conversation.findFirst({
                where: { id: conversation.id, orgId: currentUser.orgId },
                include: { customer: true },
            });
            const customer = fullConversation?.customer;
            if (customer && customer.source) {
                if ([
                    client_1.$Enums.Channel.FACEBOOK_MESSENGER,
                    client_1.$Enums.Channel.INSTAGRAM,
                    client_1.$Enums.Channel.WHATSAPP,
                ].includes(customer.source)) {
                    await this.metaService.sendOutboundTextMessage(currentUser.orgId, conversation.id, customer, dto.content);
                }
                else if (customer.source === 'EMAIL' && customer.email) {
                    await this.emailService.sendReply(currentUser.orgId, conversation.id, customer.email, dto.content, message.id);
                }
            }
            this.socketGateway.emitToOrg(currentUser.orgId, 'conversation_updated', {
                conversationId: conversation.id,
                lastMessage: dto.content,
            });
            this.socketGateway.emitToConversation(conversation.id, 'new_message', message);
        }
        catch (err) {
            this.logger.error('Failed to send outbound message', err);
        }
        return message;
    }
    async listMessages(currentUser, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                orgId: currentUser.orgId,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        if (currentUser.role === 'AGENT' && conversation.assignedTo !== currentUser.userId) {
            const [hasSentMessage, hasAuthoredNote] = await Promise.all([
                this.prisma.message.findFirst({
                    where: {
                        conversationId: conversation.id,
                        senderId: currentUser.userId,
                        senderType: client_1.SenderType.STAFF,
                    },
                    select: { id: true },
                }),
                this.prisma.conversationNote.findFirst({
                    where: {
                        conversationId: conversation.id,
                        orgId: currentUser.orgId,
                        authorId: currentUser.userId,
                    },
                    select: { id: true },
                }),
            ]);
            if (!hasSentMessage && !hasAuthoredNote) {
                throw new common_1.ForbiddenException('You do not have access to this conversation');
            }
        }
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { unreadCount: 0 },
        });
        return this.prisma.message.findMany({
            where: {
                conversationId: conversation.id,
            },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = MessagesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        meta_service_1.MetaService,
        email_service_1.EmailService,
        socket_gateway_1.SocketGateway])
], MessagesService);
//# sourceMappingURL=messages.service.js.map