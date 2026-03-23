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
var ConversationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const meta_service_1 = require("../meta/meta.service");
const email_service_1 = require("../email/email.service");
const RATING_PROMPT = 'How would you rate your experience today? Please reply with a number from 1 to 10.';
let ConversationsService = ConversationsService_1 = class ConversationsService {
    prisma;
    metaService;
    emailService;
    logger = new common_1.Logger(ConversationsService_1.name);
    constructor(prisma, metaService, emailService) {
        this.prisma = prisma;
        this.metaService = metaService;
        this.emailService = emailService;
    }
    async createConversation(currentUser, dto) {
        const { customerId } = dto;
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        const conversation = await this.prisma.conversation.create({
            data: {
                orgId: currentUser.orgId,
                customerId: customer.id,
            },
        });
        return conversation;
    }
    async listConversations(currentUser) {
        if (currentUser.role === 'ADMIN') {
            return this.prisma.conversation.findMany({
                where: { orgId: currentUser.orgId },
                orderBy: { updatedAt: 'desc' },
            });
        }
        return this.prisma.conversation.findMany({
            where: {
                orgId: currentUser.orgId,
                OR: [
                    { assignedTo: currentUser.userId },
                    {
                        messages: {
                            some: {
                                senderType: 'STAFF',
                                senderId: currentUser.userId,
                            },
                        },
                    },
                    {
                        notes: {
                            some: {
                                authorId: currentUser.userId,
                            },
                        },
                    },
                ],
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async assignConversation(currentUser, conversationId, dto) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                orgId: currentUser.orgId,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        const assignee = await this.prisma.user.findFirst({
            where: {
                id: dto.assigneeId,
                orgId: currentUser.orgId,
                role: client_1.UserRole.AGENT,
                isActive: true,
            },
        });
        if (!assignee) {
            throw new common_1.NotFoundException('Assignee not found or not an active agent in this organization');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { assignedTo: assignee.id },
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_ASSIGNED',
                targetId: updated.id,
                targetType: 'conversation',
            },
        });
        return updated;
    }
    async handoffConversation(currentUser, conversationId, assigneeId, note) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                orgId: currentUser.orgId,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        const isCurrentAssignee = conversation.assignedTo === currentUser.userId;
        if (!isCurrentAssignee && currentUser.role !== client_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only the current assignee or an admin can hand off this conversation');
        }
        const assignee = await this.prisma.user.findFirst({
            where: {
                id: assigneeId,
                orgId: currentUser.orgId,
                role: client_1.UserRole.AGENT,
                isActive: true,
            },
        });
        if (!assignee) {
            throw new common_1.NotFoundException('Tagged agent not found or not an active agent in this organization');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { assignedTo: assignee.id },
        });
        if (note && note.trim()) {
            await this.prisma.conversationNote.create({
                data: {
                    orgId: currentUser.orgId,
                    conversationId: updated.id,
                    authorId: currentUser.userId,
                    content: note,
                },
            });
        }
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_ASSIGNED',
                targetId: updated.id,
                targetType: 'conversation',
            },
        });
        return updated;
    }
    async closeConversation(currentUser, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                orgId: currentUser.orgId,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        if (currentUser.role === 'AGENT' &&
            conversation.assignedTo !== currentUser.userId) {
            throw new common_1.ForbiddenException('You are not assigned to this conversation');
        }
        const closed = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { status: client_1.ConversationStatus.CLOSED },
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_CLOSED',
                targetId: closed.id,
                targetType: 'conversation',
            },
        });
        return closed;
    }
    async resolveConversation(currentUser, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, orgId: currentUser.orgId },
            include: { customer: true },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        if (conversation.status === client_1.ConversationStatus.RESOLVED ||
            conversation.status === client_1.ConversationStatus.CLOSED) {
            throw new common_1.BadRequestException('Conversation is already resolved or closed');
        }
        if (currentUser.role === 'AGENT' &&
            conversation.assignedTo !== currentUser.userId) {
            throw new common_1.ForbiddenException('You are not assigned to this conversation');
        }
        const resolved = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                status: client_1.ConversationStatus.RESOLVED,
                awaitingRating: true,
                resolvedBy: currentUser.userId,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_RESOLVED',
                targetId: resolved.id,
                targetType: 'conversation',
            },
        });
        try {
            const customer = conversation.customer;
            if (customer?.source) {
                if ([
                    client_1.$Enums.Channel.FACEBOOK_MESSENGER,
                    client_1.$Enums.Channel.INSTAGRAM,
                    client_1.$Enums.Channel.WHATSAPP,
                ].includes(customer.source)) {
                    await this.metaService.sendOutboundTextMessage(currentUser.orgId, conversation.id, customer, RATING_PROMPT);
                }
                else if (customer.source === client_1.$Enums.Channel.EMAIL && customer.email) {
                    const msg = await this.prisma.message.create({
                        data: {
                            conversationId: conversation.id,
                            senderType: 'STAFF',
                            senderId: currentUser.userId,
                            content: RATING_PROMPT,
                        },
                    });
                    await this.emailService.sendReply(currentUser.orgId, conversation.id, customer.email, RATING_PROMPT, msg.id);
                }
            }
        }
        catch (err) {
            this.logger.error('Failed to send rating prompt', err);
        }
        return resolved;
    }
    async setStarred(currentUser, conversationId, isStarred) {
        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: conversationId,
                orgId: currentUser.orgId,
            },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        if (currentUser.role === 'AGENT' &&
            conversation.assignedTo !== currentUser.userId) {
            throw new common_1.ForbiddenException('You are not assigned to this conversation');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { isStarred },
        });
        return updated;
    }
    async updateStatus(currentUser, conversationId, status) {
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
            throw new common_1.BadRequestException('Cannot change status of a closed or resolved conversation');
        }
        if (currentUser.role === 'AGENT' &&
            conversation.assignedTo !== currentUser.userId) {
            throw new common_1.ForbiddenException('You are not assigned to this conversation');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { status },
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_STATUS_CHANGED',
                targetId: updated.id,
                targetType: 'conversation',
            },
        });
        return updated;
    }
    async getConversationTags(currentUser, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, orgId: currentUser.orgId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        const tags = await this.prisma.conversationTag.findMany({
            where: { conversationId: conversation.id },
            include: { tag: true },
        });
        return tags.map((ct) => ct.tag);
    }
    async addConversationTag(currentUser, conversationId, tagId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, orgId: currentUser.orgId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        const tag = await this.prisma.tag.findFirst({
            where: { id: tagId, orgId: currentUser.orgId },
        });
        if (!tag) {
            throw new common_1.NotFoundException('Tag not found in this organization');
        }
        await this.prisma.conversationTag.upsert({
            where: {
                conversationId_tagId: {
                    conversationId: conversation.id,
                    tagId: tag.id,
                },
            },
            create: {
                conversationId: conversation.id,
                tagId: tag.id,
            },
            update: {},
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_TAG_ADDED',
                targetId: conversation.id,
                targetType: 'conversation',
            },
        });
        return this.getConversationTags(currentUser, conversation.id);
    }
    async removeConversationTag(currentUser, conversationId, tagId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, orgId: currentUser.orgId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        await this.prisma.conversationTag.deleteMany({
            where: {
                conversationId: conversation.id,
                tagId,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_TAG_REMOVED',
                targetId: conversation.id,
                targetType: 'conversation',
            },
        });
        return this.getConversationTags(currentUser, conversation.id);
    }
    async listConversationNotes(currentUser, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, orgId: currentUser.orgId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        const notes = await this.prisma.conversationNote.findMany({
            where: { conversationId: conversation.id, orgId: currentUser.orgId },
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return notes;
    }
    async createConversationNote(currentUser, conversationId, content) {
        const trimmed = content.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('Note content cannot be empty');
        }
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, orgId: currentUser.orgId },
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found in this organization');
        }
        const note = await this.prisma.conversationNote.create({
            data: {
                orgId: currentUser.orgId,
                conversationId: conversation.id,
                authorId: currentUser.userId,
                content: trimmed,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CONVERSATION_NOTE_CREATED',
                targetId: conversation.id,
                targetType: 'conversation',
            },
        });
        return note;
    }
};
exports.ConversationsService = ConversationsService;
exports.ConversationsService = ConversationsService = ConversationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        meta_service_1.MetaService,
        email_service_1.EmailService])
], ConversationsService);
//# sourceMappingURL=conversations.service.js.map