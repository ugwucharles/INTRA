import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { UserRole, ConversationStatus, $Enums } from '@prisma/client';
import { MetaService } from '../meta/meta.service';
import { EmailService } from '../email/email.service';
import { SocketGateway } from '../socket/socket.gateway';

const RATING_PROMPT =
  'How would you rate your experience today? Please reply with a number from 1 to 10.';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaService: MetaService,
    private readonly emailService: EmailService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async createConversation(
    currentUser: JwtPayload,
    dto: CreateConversationDto,
  ) {
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

    // AGENT sees assigned conversations, plus any conversations they've previously participated in
    // (sent a staff message or added an internal note). Participation gives read-only access;
    // message sending is enforced separately in MessagesService.
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
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
      throw new NotFoundException(
        'Assignee not found or not an active agent in this organization',
      );
    }

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: { assignedTo: assignee.id },
    });

    const updated = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'CONVERSATION_ASSIGNED',
        targetId: conversation.id,
        targetType: 'conversation',
      },
    });

    return updated;
  }

  async handoffConversation(
    currentUser: JwtPayload,
    conversationId: string,
    assigneeId: string,
    note?: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        orgId: currentUser.orgId,
      },
    });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    // Only the current assignee or an admin can hand off
    const isCurrentAssignee = conversation.assignedTo === currentUser.userId;
    if (!isCurrentAssignee && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only the current assignee or an admin can hand off this conversation',
      );
    }

    const assignee = await this.prisma.user.findFirst({
      where: {
        id: assigneeId,
        orgId: currentUser.orgId,
        role: UserRole.AGENT,
        isActive: true,
      },
    });

    if (!assignee) {
      throw new NotFoundException(
        'Tagged agent not found or not an active agent in this organization',
      );
    }

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: { assignedTo: assignee.id },
    });

    const updated = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
    });

    if (note && note.trim()) {
      await this.prisma.conversationNote.create({
        data: {
          orgId: currentUser.orgId,
          conversationId: conversation.id,
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
        targetId: conversation.id,
        targetType: 'conversation',
      },
    });

    return updated;
  }

  async unassignConversation(currentUser: JwtPayload, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        orgId: currentUser.orgId,
      },
    });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    if (!conversation.assignedTo) {
      throw new BadRequestException('Conversation is already unassigned');
    }

    if (
      conversation.status === ConversationStatus.CLOSED ||
      conversation.status === ConversationStatus.RESOLVED
    ) {
      throw new BadRequestException(
        'Cannot unassign a closed or resolved conversation',
      );
    }

    const previousAssigneeId = conversation.assignedTo;

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: { assignedTo: null },
    });

    const updated = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'CONVERSATION_UNASSIGNED',
        targetId: conversation.id,
        targetType: 'conversation',
      },
    });

    // Real-time: notify the org so the UI can move this conversation
    // back to the unassigned pool instantly.
    this.socketGateway.emitToOrg(currentUser.orgId, 'conversation_unassigned', {
      conversationId: conversation.id,
      previousAssigneeId,
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    // AGENT can close only their own assigned conversations
    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: { status: ConversationStatus.CLOSED },
    });

    const closed = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'CONVERSATION_CLOSED',
        targetId: conversation.id,
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    if (
      conversation.status === ConversationStatus.RESOLVED ||
      conversation.status === ConversationStatus.CLOSED
    ) {
      throw new BadRequestException(
        'Conversation is already resolved or closed',
      );
    }

    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: {
        status: ConversationStatus.RESOLVED,
        awaitingRating: true,
        resolvedBy: currentUser.userId,
      },
    });

    const resolved = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'CONVERSATION_RESOLVED',
        targetId: conversation.id,
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
              orgId: currentUser.orgId,
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    // Agents can star only their own assigned conversations; admins can star any in org
    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: { isStarred },
    });

    const updated = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    if (
      conversation.status === ConversationStatus.CLOSED ||
      conversation.status === ConversationStatus.RESOLVED
    ) {
      throw new BadRequestException(
        'Cannot change status of a closed or resolved conversation',
      );
    }

    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: { status },
    });

    const updated = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'CONVERSATION_STATUS_CHANGED',
        targetId: conversation.id,
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, orgId: currentUser.orgId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found in this organization');
    }

    // Use findFirst + create instead of upsert to stay tenant-safe
    const existingLink = await this.prisma.conversationTag.findFirst({
      where: {
        conversationId: conversation.id,
        tagId: tag.id,
        orgId: currentUser.orgId,
      },
    });
    if (!existingLink) {
      await this.prisma.conversationTag.create({
        data: {
          orgId: currentUser.orgId,
          conversationId: conversation.id,
          tagId: tag.id,
        },
      });
    }

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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    await this.prisma.conversationTag.deleteMany({
      where: {
        conversationId: conversation.id,
        tagId,
        orgId: currentUser.orgId,
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
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
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
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

  async deleteConversation(currentUser: JwtPayload, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId: currentUser.orgId },
    });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found in this organization',
      );
    }

    // Admins can delete any; Agents can only delete if assigned?
    // Usually only Admins should delete conversations.
    if (currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can delete conversations',
      );
    }

    return this.prisma.$transaction([
      this.prisma.message.deleteMany({
        where: { conversationId, orgId: currentUser.orgId },
      }),
      this.prisma.conversationNote.deleteMany({
        where: { conversationId, orgId: currentUser.orgId },
      }),
      this.prisma.conversationTag.deleteMany({
        where: { conversationId, orgId: currentUser.orgId },
      }),
      this.prisma.conversation.deleteMany({
        where: { id: conversationId, orgId: currentUser.orgId },
      }),
    ]);
  }
}
