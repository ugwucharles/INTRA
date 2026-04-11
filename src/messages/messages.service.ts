import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  SenderType,
  $Enums,
  ConversationStatus,
  MessageStatus,
} from '@prisma/client';
import { MetaService } from '../meta/meta.service';
import { EmailService } from '../email/email.service';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaService: MetaService,
    private readonly emailService: EmailService,
    private readonly socketGateway: SocketGateway,
  ) {}

  async createMessage(
    currentUser: JwtPayload,
    conversationId: string,
    dto: CreateMessageDto,
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

    // Do not allow sending new staff messages on CLOSED or RESOLVED conversations.
    if (
      conversation.status === ConversationStatus.CLOSED ||
      conversation.status === ConversationStatus.RESOLVED
    ) {
      throw new ForbiddenException(
        'Cannot send messages on a closed or resolved conversation',
      );
    }

    // AGENT can send only on assigned conversations
    const isAssignedToSomeone = !!conversation.assignedTo;
    const isCurrentAssignee = conversation.assignedTo === currentUser.userId;

    // When a conversation is assigned, only that agent can send messages (no admins).
    if (isAssignedToSomeone && !isCurrentAssignee) {
      throw new ForbiddenException(
        'Only the assigned agent can send messages on this conversation',
      );
    }

    // When unassigned, only admins can talk directly to the customer.
    if (!isAssignedToSomeone && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only an admin can send messages on an unassigned conversation',
      );
    }

    this.logger.log(
      `Creating STAFF message for org ${currentUser.orgId}, conversation ${conversation.id}`,
    );
    const fullConversation = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId: currentUser.orgId },
      include: { customer: true },
    });
    const customer = fullConversation?.customer;
    const isSocialCustomer =
      !!customer &&
      !!customer.source &&
      (
        [
          $Enums.Channel.FACEBOOK_MESSENGER,
          $Enums.Channel.INSTAGRAM,
          $Enums.Channel.WHATSAPP,
        ] as string[]
      ).includes(customer.source);

    const message = await this.prisma.message.create({
      data: {
        orgId: currentUser.orgId,
        conversationId: conversation.id,
        senderType: SenderType.STAFF,
        senderId: currentUser.userId,
        content: dto.content,
        status: isSocialCustomer ? MessageStatus.PENDING : MessageStatus.SENT,
      },
    });

    // Emit real-time updates IMMEDIATELY after creation, before the external API send
    this.socketGateway.emitToOrg(currentUser.orgId, 'conversation_updated', {
      conversationId: conversation.id,
      lastMessage: dto.content,
    });
    this.socketGateway.emitToConversation(
      conversation.id,
      'new_message',
      message,
      currentUser.orgId,
    );
    this.logger.log(`Created message ${message.id} and emitted socket event`);

    if (conversation.firstResponseTime === null) {
      const secondsDiff = Math.floor(
        (Date.now() - conversation.createdAt.getTime()) / 1000,
      );
      await this.prisma.conversation.updateMany({
        where: { id: conversation.id, orgId: currentUser.orgId },
        data: { firstResponseTime: secondsDiff },
      });
    }

    // If this conversation is linked to an external customer, attempt outbound delivery.
    // For social channels we persist explicit delivery state:
    // PENDING -> SENT on success, PENDING -> FAILED on API error.
    try {
      if (customer && customer.source) {
        if (isSocialCustomer) {
          // Auto-send outbound messages for Messenger, Instagram, and WhatsApp.
          await this.metaService.sendOutboundTextMessage(
            currentUser.orgId,
            conversation.id,
            customer,
            dto.content,
          );
          await this.prisma.message.updateMany({
            where: { id: message.id, orgId: currentUser.orgId },
            data: { status: MessageStatus.SENT },
          });
        } else if ((customer.source as string) === 'EMAIL' && customer.email) {
          // Auto-send outbound messages for EMAIL
          await this.emailService.sendReply(
            currentUser.orgId,
            conversation.id,
            customer.email,
            dto.content,
            message.id,
          );
        }
      }
    } catch (err) {
      if (isSocialCustomer) {
        await this.prisma.message.updateMany({
          where: { id: message.id, orgId: currentUser.orgId },
          data: { status: MessageStatus.FAILED },
        });
      }
      this.logger.error(
        `Failed to send outbound Meta message for conversation ${conversation.id}`,
        err as Error,
      );
      throw new BadRequestException(
        'Message saved but delivery failed. Please verify channel connection and try again.',
      );
    }

    return message;
  }

  async listMessages(currentUser: JwtPayload, conversationId: string) {
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

    // AGENT read access:
    // - current assignee can view
    // - agents who previously participated (sent a staff message or added an internal note) can view read-only
    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      const [hasSentMessage, hasAuthoredNote] = await Promise.all([
        this.prisma.message.findFirst({
          where: {
            conversationId: conversation.id,
            senderId: currentUser.userId,
            senderType: SenderType.STAFF,
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
        throw new ForbiddenException(
          'You do not have access to this conversation',
        );
      }
    }

    // Mark messages as read when listing them
    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId: currentUser.orgId },
      data: { unreadCount: 0 },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        orgId: currentUser.orgId,
        conversationId: conversation.id,
      },
      orderBy: { createdAt: 'asc' },
    });
    this.logger.log(
      `Found ${messages.length} messages for conversation ${conversation.id} in org ${currentUser.orgId}`,
    );
    return messages;
  }
}
