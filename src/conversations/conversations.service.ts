import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { UserRole, ConversationStatus, $Enums } from '@prisma/client';
import { MetaService } from '../meta/meta.service';
import { EmailService } from '../email/email.service';

const RATING_PROMPT =
  'How would you rate your experience today? Please reply with a number from 1 to 10.';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaService: MetaService,
    private readonly emailService: EmailService,
  ) {}

  async createConversation(currentUser: JwtPayload, dto: CreateConversationDto) {
    const { customerId } = dto;

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId: currentUser.orgId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found in this organization');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        orgId: currentUser.orgId,
        customerId: customer.id,
      },
    });

    return conversation;
  }

  async listConversations(currentUser: JwtPayload) {
    if (currentUser.role === 'ADMIN') {
      // Admin sees all org conversations
      return this.prisma.conversation.findMany({
        where: { orgId: currentUser.orgId },
        orderBy: { updatedAt: 'desc' },
      });
    }

    // AGENT sees only assigned conversations
    return this.prisma.conversation.findMany({
      where: {
        orgId: currentUser.orgId,
        assignedTo: currentUser.userId,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async assignConversation(
    currentUser: JwtPayload,
    conversationId: string,
    dto: AssignConversationDto,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        orgId: currentUser.orgId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
    }

    const assignee = await this.prisma.user.findFirst({
      where: {
        id: dto.assigneeId,
        orgId: currentUser.orgId,
        role: UserRole.AGENT,
        isActive: true,
      },
    });

    if (!assignee) {
      throw new NotFoundException('Assignee not found or not an active agent in this organization');
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

  async closeConversation(currentUser: JwtPayload, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        orgId: currentUser.orgId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
    }

    // AGENT can close only their own assigned conversations
    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    const closed = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: ConversationStatus.CLOSED },
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

  async resolveConversation(currentUser: JwtPayload, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId: currentUser.orgId },
      include: { customer: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
    }

    if (
      conversation.status === ConversationStatus.RESOLVED ||
      conversation.status === ConversationStatus.CLOSED
    ) {
      throw new BadRequestException('Conversation is already resolved or closed');
    }

    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    const resolved = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: ConversationStatus.RESOLVED,
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

    // Send the rating prompt to the customer on their channel
    try {
      const customer = conversation.customer;
      if (customer?.source) {
        if (
          (
            [
              $Enums.Channel.FACEBOOK_MESSENGER,
              $Enums.Channel.INSTAGRAM,
              $Enums.Channel.WHATSAPP,
            ] as string[]
          ).includes(customer.source)
        ) {
          await this.metaService.sendOutboundTextMessage(
            currentUser.orgId,
            conversation.id,
            customer,
            RATING_PROMPT,
          );
        } else if (customer.source === $Enums.Channel.EMAIL && customer.email) {
          // Create a placeholder message record for idempotency then send via SMTP
          const msg = await this.prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderType: 'STAFF',
              senderId: currentUser.userId,
              content: RATING_PROMPT,
            },
          });
          await this.emailService.sendReply(
            currentUser.orgId,
            conversation.id,
            customer.email,
            RATING_PROMPT,
            msg.id,
          );
        }
      }
    } catch (err) {
      this.logger.error('Failed to send rating prompt', err as Error);
    }

    return resolved;
  }

  async setStarred(
    currentUser: JwtPayload,
    conversationId: string,
    isStarred: boolean,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        orgId: currentUser.orgId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
    }

    // Agents can star only their own assigned conversations; admins can star any in org
    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { isStarred },
    });

    return updated;
  }

  async updateStatus(
    currentUser: JwtPayload,
    conversationId: string,
    status: ConversationStatus,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        orgId: currentUser.orgId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
    }

    if (
      conversation.status === ConversationStatus.CLOSED ||
      conversation.status === ConversationStatus.RESOLVED
    ) {
      throw new BadRequestException('Cannot change status of a closed or resolved conversation');
    }

    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
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

  async getConversationTags(currentUser: JwtPayload, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId: currentUser.orgId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
    }

    const tags = await this.prisma.conversationTag.findMany({
      where: { conversationId: conversation.id },
      include: { tag: true },
    });

    return tags.map((ct: any) => ct.tag);
  }

  async addConversationTag(
    currentUser: JwtPayload,
    conversationId: string,
    tagId: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId: currentUser.orgId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
    }

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, orgId: currentUser.orgId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found in this organization');
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

  async removeConversationTag(
    currentUser: JwtPayload,
    conversationId: string,
    tagId: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId: currentUser.orgId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
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

  async listConversationNotes(currentUser: JwtPayload, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId: currentUser.orgId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
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

  async createConversationNote(
    currentUser: JwtPayload,
    conversationId: string,
    content: string,
  ) {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new BadRequestException('Note content cannot be empty');
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId: currentUser.orgId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found in this organization');
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
}
