import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { SenderType, $Enums, ConversationStatus } from '@prisma/client';
import { MetaService } from '../meta/meta.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaService: MetaService,
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

    // Do not allow sending new staff messages on CLOSED conversations.
    if (conversation.status === ConversationStatus.CLOSED) {
      throw new ForbiddenException('Cannot send messages on a closed conversation');
    }

    // AGENT can send only on assigned conversations
    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderType: SenderType.STAFF,
        senderId: currentUser.userId,
        content: dto.content,
      },
    });

    // If this conversation is linked to a Meta customer, send the message back to Messenger/Instagram
    try {
      const fullConversation = await this.prisma.conversation.findFirst({
        where: { id: conversation.id, orgId: currentUser.orgId },
        include: { customer: true },
      });

      const customer = fullConversation?.customer;
      if (
        customer &&
        customer.source &&
        [
          $Enums.Channel.FACEBOOK_MESSENGER,
          $Enums.Channel.INSTAGRAM,
        ].includes(customer.source)
      ) {
        // Auto-send outbound messages for Messenger and Instagram via Meta /me/messages.
        await this.metaService.sendOutboundTextMessage(
          currentUser.orgId,
          conversation.id,
          customer,
          dto.content,
        );
      }
    } catch (err) {
      this.logger.error('Failed to send outbound Meta message', err as Error);
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

    // AGENT can view only their own assigned conversations
    if (
      currentUser.role === 'AGENT' &&
      conversation.assignedTo !== currentUser.userId
    ) {
      throw new ForbiddenException('You are not assigned to this conversation');
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
