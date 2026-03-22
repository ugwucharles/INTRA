import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { SenderType, $Enums, ConversationStatus } from '@prisma/client';
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
      throw new NotFoundException('Conversation not found in this organization');
    }

    // Do not allow sending new staff messages on CLOSED or RESOLVED conversations.
    if (
      conversation.status === ConversationStatus.CLOSED ||
      conversation.status === ConversationStatus.RESOLVED
    ) {
      throw new ForbiddenException('Cannot send messages on a closed or resolved conversation');
    }

    // AGENT can send only on assigned conversations
    const isAssignedToSomeone = !!conversation.assignedTo;
    const isCurrentAssignee = conversation.assignedTo === currentUser.userId;

    // When a conversation is assigned, only that agent can send messages (no admins).
    if (isAssignedToSomeone && !isCurrentAssignee) {
      throw new ForbiddenException('Only the assigned agent can send messages on this conversation');
    }

    // When unassigned, only admins can talk directly to the customer.
    if (!isAssignedToSomeone && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only an admin can send messages on an unassigned conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: SenderType.STAFF,
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

    // If this conversation is linked to a Meta customer, send the message back to Messenger/Instagram
    try {
      const fullConversation = await this.prisma.conversation.findFirst({
        where: { id: conversation.id, orgId: currentUser.orgId },
        include: { customer: true },
      });

      const customer = fullConversation?.customer;
      if (customer && customer.source) {
        if (
          ([
            $Enums.Channel.FACEBOOK_MESSENGER,
            $Enums.Channel.INSTAGRAM,
            $Enums.Channel.WHATSAPP,
          ] as string[]).includes(customer.source)
        ) {
          // Auto-send outbound messages for Messenger, Instagram, and WhatsApp.
          await this.metaService.sendOutboundTextMessage(
            currentUser.orgId,
            conversation.id,
            customer,
            dto.content,
          );
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
 
      // Emit real-time update via WebSocket
      this.socketGateway.emitToOrg(currentUser.orgId, 'conversation_updated', {
        conversationId: conversation.id,
        lastMessage: dto.content,
      });
      this.socketGateway.emitToConversation(conversation.id, 'new_message', message);
    } catch (err) {
      this.logger.error('Failed to send outbound message', err as Error);
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
      throw new NotFoundException('Conversation not found in this organization');
    }

    // AGENT read access:
    // - current assignee can view
    // - agents who previously participated (sent a staff message or added an internal note) can view read-only
    if (currentUser.role === 'AGENT' && conversation.assignedTo !== currentUser.userId) {
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
        throw new ForbiddenException('You do not have access to this conversation');
      }
    }

    // Mark messages as read when listing them
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
}
