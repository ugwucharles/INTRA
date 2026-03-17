import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationStatus, SenderType, $Enums, MessageStatus, AutoReplyTrigger, RoutingSettings } from '@prisma/client';
import { RoutingService, RoutingOutcome } from '../routing/routing.service';
import { RoutingSettingsService } from '../routing/routing-settings.service';
import { AutoReplyService } from '../auto-reply/auto-reply.service';

@Injectable()
export class MetaService {
  private readonly logger = new Logger(MetaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly routingService: RoutingService,
    private readonly routingSettingsService: RoutingSettingsService,
    private readonly autoReplyService: AutoReplyService,
  ) {}

  async handleWebhook(body: any) {
    // Structured log for webhook receipt
    this.logger.log(
      JSON.stringify({
        event: 'meta.webhook.received',
        object: (body && body.object) || null,
      }),
    );

    if (!body || !body.object || !Array.isArray(body.entry)) {
      this.logger.warn('Ignoring unknown webhook payload');
      return;
    }

    const orgId = process.env.META_DEFAULT_ORG_ID;
    if (!orgId) {
      this.logger.error('META_DEFAULT_ORG_ID is not set; cannot route messages');
      return;
    }

    for (const entry of body.entry) {
      // WhatsApp Business Account webhook: entry.changes[].value holds {contacts, messages}
      if (body.object === 'whatsapp_business_account' && Array.isArray(entry.changes)) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value) {
            try {
              await this.handleWhatsAppWebhookValue(orgId, change.value);
            } catch (err) {
              this.logger.error('Failed to handle WhatsApp webhook value', err as Error);
            }
          }
        }
        continue;
      }

      let messagingEvents: any[] = [];

      if (body.object === 'instagram' && Array.isArray(entry.changes)) {
        // Instagram sends events under entry.changes[].value for messages
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value) {
            messagingEvents.push(change.value);
          }
        }
      } else {
        // Messenger / Page format
        messagingEvents = entry.messaging ?? entry.standby ?? [];
      }

      if (!Array.isArray(messagingEvents) || messagingEvents.length === 0) continue;

      const pageId: string | undefined = entry.id;

      for (const event of messagingEvents) {
        try {
          await this.handleMessagingEvent(body.object, orgId, event, pageId);
        } catch (err) {
          this.logger.error('Failed to handle messaging event', err as Error);
        }
      }
    }
  }

  /**
   * Delete all conversations and messages for a given customer in an org,
   * then delete the customer record itself.
   */
  async deleteCustomerData(orgId: string, customerId: string): Promise<{ success: boolean }> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        orgId,
      },
    });

    if (!customer) {
      // Nothing to delete; treat as success to avoid leaking existence.
      this.logger.warn(
        `Requested delete for non-existent customer ${customerId} in org ${orgId}`,
      );
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

    this.logger.log(
      `Deleted Meta data for customer ${customerId} in org ${orgId}`,
    );

    return { success: true };
  }

  /**
   * Process a queued outbound message: send to Meta and update Message status.
   */
  async processOutboundJob(
    orgId: string,
    conversationId: string,
    customer: {
      id: string;
      source: $Enums.Channel | null;
      externalId: string | null;
      pageId: string | null;
    },
    messageId: string,
    text: string,
  ): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      this.logger.warn(
        JSON.stringify({
          event: 'meta.outbound.skip',
          reason: 'missing_message',
          orgId,
          conversationId,
          messageId,
        }),
      );
      return;
    }

    if (message.status !== MessageStatus.PENDING) {
      this.logger.warn(
        JSON.stringify({
          event: 'meta.outbound.skip',
          reason: 'not_pending',
          orgId,
          conversationId,
          messageId,
          status: message.status,
        }),
      );
      return;
    }

    try {
      await this.sendOutboundTextMessage(orgId, conversationId, customer, text);

      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: MessageStatus.SENT,
        },
      });

      this.logger.log(
        JSON.stringify({
          event: 'meta.outbound.sent',
          orgId,
          conversationId,
          messageId,
          customerId: customer.id,
        }),
      );
    } catch (err: any) {
      const newRetry = (message.retryCount ?? 0) + 1;

      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          retryCount: newRetry,
          status: newRetry >= 3 ? MessageStatus.FAILED : MessageStatus.PENDING,
        },
      });

      this.logger.error(
        JSON.stringify({
          event: 'meta.outbound.error',
          orgId,
          conversationId,
          messageId,
          customerId: customer.id,
          retryCount: newRetry,
          error: err?.message ?? 'unknown',
        }),
      );

      if (newRetry >= 3) {
        return;
      }

      throw err;
    }
  }

  /**
   * Fetch the display name for a Facebook Messenger user (PSID) via Graph API.
   */
  private async fetchMessengerName(psid: string): Promise<string | null> {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
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

      const data: any = await res.json().catch(() => null);
      if (!data || typeof data.name !== 'string') {
        return null;
      }

      const trimmed = data.name.trim();
      return trimmed.length > 0 ? trimmed : null;
    } catch (err) {
      this.logger.error('Failed to fetch Messenger profile name', err as Error);
      return null;
    }
  }

  /**
   * Fetch the display name/username for an Instagram sender via Graph API.
   * We try META_PAGE_ACCESS_TOKEN first, falling back to INSTAGRAM_ACCESS_TOKEN if present.
   */
  private async fetchInstagramName(igSenderId: string): Promise<string | null> {
    // Prefer a dedicated Instagram token when available, fall back to page token.
    const accessToken =
      process.env.INSTAGRAM_ACCESS_TOKEN ?? process.env.META_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
      this.logger.warn(
        'No Instagram access token configured; cannot fetch Instagram profile name',
      );
      return null;
    }

    try {
      const url = new URL(`https://graph.facebook.com/v19.0/${igSenderId}`);
      url.searchParams.set('access_token', accessToken);
      url.searchParams.set('fields', 'name,username');

      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(
          `Instagram profile fetch failed for sender ${igSenderId}: ${res.status} ${res.statusText} ${body}`,
        );
        return null;
      }

      const data: any = await res.json().catch(() => null);
      if (!data) {
        return null;
      }

      const nameCandidate =
        (typeof data.name === 'string' && data.name.trim().length > 0
          ? data.name.trim()
          : null) ||
        (typeof data.username === 'string' && data.username.trim().length > 0
          ? data.username.trim()
          : null);

      return nameCandidate || null;
    } catch (err) {
      this.logger.error('Failed to fetch Instagram profile name', err as Error);
      return null;
    }
  }

  /**
   * Send a simple text message back to a Meta customer (Facebook/Instagram/WhatsApp).
   * Used by staff replies in the CRM.
   */
  async sendOutboundTextMessage(
    orgId: string,
    conversationId: string,
    customer: {
      id: string;
      source: $Enums.Channel | null;
      externalId: string | null;
      pageId: string | null;
    },
    text: string,
  ): Promise<void> {
    if (!customer.source || !customer.externalId) {
      this.logger.warn('Cannot send Meta message: missing source or externalId');
      return;
    }

    if (customer.source === $Enums.Channel.WHATSAPP) {
      await this.sendWhatsAppTextMessage(orgId, conversationId, customer.id, customer.externalId, text);
      return;
    }

    const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!pageAccessToken) {
      this.logger.error('META_PAGE_ACCESS_TOKEN is not set; cannot send outbound messages');
      return;
    }

    const url = new URL('https://graph.facebook.com/v19.0/me/messages');
    url.searchParams.set('access_token', pageAccessToken);

    const payload: any = {
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
        this.logger.error(
          `Failed to send Meta message for org ${orgId}, conversation ${conversationId}: ${response.status} ${response.statusText} ${errorText}`,
        );
      } else {
        this.logger.log(
          `Sent Meta message for org ${orgId}, customer ${customer.id}, conversation ${conversationId}`,
        );
      }
    } catch (err) {
      this.logger.error('Error while sending Meta message', err as Error);
    }
  }

  /**
   * Send an outbound text message via the WhatsApp Business Cloud API.
   */
  private async sendWhatsAppTextMessage(
    orgId: string,
    conversationId: string,
    customerId: string,
    toWaId: string,
    text: string,
  ): Promise<void> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? process.env.META_PAGE_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      this.logger.error(
        'WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is not set; cannot send WhatsApp message',
      );
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
        this.logger.error(
          `Failed to send WhatsApp message for org ${orgId}, conversation ${conversationId}: ${response.status} ${response.statusText} ${errorText}`,
        );
      } else {
        this.logger.log(
          `Sent WhatsApp message for org ${orgId}, customer ${customerId}, conversation ${conversationId}`,
        );
      }
    } catch (err) {
      this.logger.error('Error while sending WhatsApp message', err as Error);
    }
  }

  /**
   * Handle a WhatsApp Business webhook value object.
   * The value contains contacts[] (with profile names) and messages[] arrays.
   */
  private async handleWhatsAppWebhookValue(orgId: string, value: any): Promise<void> {
    const messages: any[] = value.messages ?? [];
    const contacts: any[] = value.contacts ?? [];

    // Build a map of wa_id -> display name from the contacts array
    const nameByWaId = new Map<string, string>();
    for (const contact of contacts) {
      const waId: string | undefined = contact.wa_id;
      const name: string | undefined = contact.profile?.name;
      if (waId && name) {
        nameByWaId.set(waId, name);
      }
    }

    for (const msg of messages) {
      // Only handle inbound text messages for now
      if (msg.type !== 'text' || !msg.text?.body) {
        this.logger.log(`Ignoring non-text WhatsApp message (type=${msg.type})`);
        continue;
      }

      const waId: string | undefined = msg.from;
      if (!waId) {
        this.logger.warn('WhatsApp message missing sender wa_id');
        continue;
      }

      const text: string = msg.text.body;
      const externalId: string | undefined = msg.id;
      const rawTimestamp: number | undefined =
        typeof msg.timestamp === 'string' ? parseInt(msg.timestamp, 10) : msg.timestamp;
      const sentAt: Date | undefined =
        typeof rawTimestamp === 'number' && !isNaN(rawTimestamp)
          ? new Date(rawTimestamp * 1000)
          : undefined;

      const displayName: string | null = nameByWaId.get(waId) ?? null;

      // Upsert customer by (orgId, WHATSAPP, waId)
      let customer = await this.prisma.customer.findFirst({
        where: { orgId, source: $Enums.Channel.WHATSAPP, externalId: waId },
      });

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            orgId,
            source: $Enums.Channel.WHATSAPP,
            externalId: waId,
            phone: waId,
            name: displayName,
            isSaved: false,
          },
        });
      } else if (displayName && customer.name !== displayName) {
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: { name: displayName },
        });
      }

      // Find an OPEN conversation or a RESOLVED one that is awaiting a rating reply
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
          data: { orgId, customerId: customer.id },
        });
      }

      const hadRoutingQuestionAlreadySent = !!conversation.routingQuestionSent;
      const isAwaitingRating =
        conversation.status === ConversationStatus.RESOLVED && conversation.awaitingRating;

      // Store the inbound message with idempotency guard
      let message;
      try {
        message = await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderType: SenderType.CUSTOMER,
            senderId: waId,
            content: text,
            externalId: externalId,
            ...(sentAt && { createdAt: sentAt }),
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2002') {
          this.logger.warn(
            `Duplicate WhatsApp message ignored for conversation ${conversation.id}, externalId=${externalId}`,
          );
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

      this.logger.log(
        JSON.stringify({
          event: 'whatsapp.inbound.stored',
          orgId,
          customerId: customer.id,
          conversationId: conversation.id,
          waId,
          externalId,
          createdAt: message.createdAt.toISOString(),
        }),
      );

      // If this conversation is awaiting a customer rating, process it now
      if (isAwaitingRating) {
        await this.processRatingReply(orgId, conversation.id, conversation.resolvedBy, text);
        continue;
      }

      // Load routing settings
      const settings = await this.routingSettingsService.getOrCreate(orgId);
      const settingsMeta: any = settings.metadata ?? {};
      const sendFirstMessage = settingsMeta.sendFirstMessage ?? true;
      const sendDepartmentQuestion = settingsMeta.sendDepartmentQuestion ?? true;
      const reaskOnInvalidSelection = settingsMeta.reaskOnInvalidSelection ?? true;
      const isAfterHours = this.computeIsAfterHours(settings);

      const totalMessages = await this.prisma.message.count({
        where: { conversationId: conversation.id },
      });
      const isFirstMessage = totalMessages === 1;

      // Auto-replies
      try {
        const repliesToSend: string[] = [];

        if (isAfterHours) {
          const afterHoursReplies = await this.autoReplyService.getReplies(
            orgId,
            AutoReplyTrigger.AFTER_HOURS,
          );
          repliesToSend.push(...afterHoursReplies.map((r) => r.message));
        }

        if (isFirstMessage && sendFirstMessage) {
          const firstReplies = await this.autoReplyService.getReplies(
            orgId,
            AutoReplyTrigger.FIRST_MESSAGE,
          );
          repliesToSend.push(...firstReplies.map((r) => r.message));
        }

        if (sendDepartmentQuestion && !conversation.departmentId && !hadRoutingQuestionAlreadySent) {
          const questionReplies = await this.autoReplyService.getReplies(
            orgId,
            AutoReplyTrigger.DEPARTMENT_SELECTION,
          );
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
      } catch (err) {
        this.logger.error('WhatsApp auto-reply error', err as Error);
      }

      // Routing
      try {
        const routingOutcome: RoutingOutcome | null = hadRoutingQuestionAlreadySent
          ? await this.routingService.handleInboundRouting({
              orgId,
              conversationId: conversation.id,
              customerId: customer.id,
              text,
            })
          : null;

        if (routingOutcome?.invalidSelection && reaskOnInvalidSelection && sendDepartmentQuestion) {
          const questionReplies = await this.autoReplyService.getReplies(
            orgId,
            AutoReplyTrigger.DEPARTMENT_SELECTION,
          );
          for (const reply of questionReplies) {
            await this.sendWhatsAppTextMessage(orgId, conversation.id, customer.id, waId, reply.message);
          }
        }

        if (routingOutcome?.noAgentAvailable) {
          const noAgentReplies = await this.autoReplyService.getReplies(
            orgId,
            AutoReplyTrigger.NO_AGENT_AVAILABLE,
            routingOutcome.departmentId,
          );
          for (const reply of noAgentReplies) {
            await this.sendWhatsAppTextMessage(orgId, conversation.id, customer.id, waId, reply.message);
          }
        }
      } catch (err) {
        this.logger.error('WhatsApp routing error', err as Error);
      }
    }
  }

  private async handleMessagingEvent(
    objectType: string,
    orgId: string,
    event: any,
    pageId: string | undefined,
  ) {
    // Ignore echoes or non-message events for now
    if (!event.message || event.message.is_echo) {
      return;
    }

    const text: string | undefined = event.message.text;
    if (!text) {
      // For now we store only text messages; non-text can be added later.
      this.logger.log('Ignoring non-text message from Meta');
      return;
    }

    // PSID (or Instagram sender id)
    const senderId: string | undefined = event.sender?.id;
    if (!senderId) {
      this.logger.warn('Meta event without sender id');
      return;
    }

    // Timestamp from Meta (milliseconds since epoch)
    const rawTimestamp: number | undefined = event.timestamp;
    const sentAt: Date | undefined =
      typeof rawTimestamp === 'number' ? new Date(rawTimestamp) : undefined;

    const channel: $Enums.Channel =
      objectType === 'instagram'
        ? $Enums.Channel.INSTAGRAM
        : $Enums.Channel.FACEBOOK_MESSENGER;

    // Best-effort fetch of the social profile name so CRM shows real names.
    let displayName: string | null = null;
    if (channel === $Enums.Channel.FACEBOOK_MESSENGER) {
      displayName = await this.fetchMessengerName(senderId);
    } else if (channel === $Enums.Channel.INSTAGRAM) {
      displayName = await this.fetchInstagramName(senderId);
    }

    // Upsert customer based on (orgId, source, externalId). We still store pageId but
    // do not include it in the unique key because PSID is already unique per page.
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
          // Auto-created from DM: not yet an explicitly saved contact.
          isSaved: false,
        },
      });
    } else if (displayName && customer.name !== displayName) {
      customer = await this.prisma.customer.update({
        where: { id: customer.id },
        data: { name: displayName },
      });
    }

    // Find an OPEN conversation or a RESOLVED one that is awaiting a rating reply
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
        },
      });
    }

    const isAwaitingRating =
      conversation.status === ConversationStatus.RESOLVED && conversation.awaitingRating;

    // Capture whether a routing question had already been sent *before* this inbound message.
    // We use this to avoid interpreting the very first customer message (which triggers the question)
    // as a department selection reply.
    const hadRoutingQuestionAlreadySent = !!conversation.routingQuestionSent;

    const mid: string | undefined = event.message.mid;

    // Create message as coming from CUSTOMER. Use externalId for idempotency when available.
    let message;
    try {
      message = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderType: SenderType.CUSTOMER,
          senderId,
          content: text,
          externalId: mid,
          ...(sentAt && { createdAt: sentAt }),
        },
      });
    } catch (err: any) {
      // Ignore duplicates when we see the same (conversationId, externalId)
      if (err?.code === 'P2002') {
        this.logger.warn(
          `Duplicate Meta message ignored for conversation ${conversation.id}, externalId=${mid}`,
        );
        return;
      }
      throw err;
    }

    // Keep conversation's updatedAt and unreadCount in sync with latest inbound message
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        // Use the message timestamp if available, otherwise let Prisma set updatedAt to now()
        ...(sentAt && { updatedAt: sentAt }),
        unreadCount: { increment: 1 },
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'meta.inbound.stored',
        channel,
        orgId,
        customerId: customer.id,
        conversationId: conversation.id,
        senderId,
        externalId: mid,
        createdAt: message.createdAt.toISOString(),
      }),
    );

    // If this conversation is awaiting a customer rating, process it and skip auto-replies
    if (isAwaitingRating) {
      await this.processRatingReply(orgId, conversation.id, conversation.resolvedBy, text);
      return;
    }

    // Load routing settings once
    const settings = await this.routingSettingsService.getOrCreate(orgId);
    const settingsMeta: any = settings.metadata ?? {};
    const sendFirstMessage = settingsMeta.sendFirstMessage ?? true;
    const sendDepartmentQuestion = settingsMeta.sendDepartmentQuestion ?? true;
    const reaskOnInvalidSelection = settingsMeta.reaskOnInvalidSelection ?? true;

    const isAfterHours = this.computeIsAfterHours(settings);

    // Determine context for auto-replies
    const totalMessages = await this.prisma.message.count({
      where: { conversationId: conversation.id },
    });
    const isFirstMessage = totalMessages === 1;

    // Auto replies BEFORE routing
    try {
      const repliesToSend: string[] = [];

      if (isAfterHours) {
        const afterHoursReplies = await this.autoReplyService.getReplies(
          orgId,
          AutoReplyTrigger.AFTER_HOURS,
        );
        repliesToSend.push(...afterHoursReplies.map((r) => r.message));
      }

      if (isFirstMessage && sendFirstMessage) {
        const firstReplies = await this.autoReplyService.getReplies(
          orgId,
          AutoReplyTrigger.FIRST_MESSAGE,
        );
        repliesToSend.push(...firstReplies.map((r) => r.message));
      }

      // Department question comes after greeting/after-hours, if enabled and not yet routed.
      // We only send the question the first time (per conversation), and we DO NOT treat the
      // same inbound message that triggered the question as a department selection.
      if (sendDepartmentQuestion && !conversation.departmentId && !hadRoutingQuestionAlreadySent) {
        const questionReplies = await this.autoReplyService.getReplies(
          orgId,
          AutoReplyTrigger.DEPARTMENT_SELECTION,
        );
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
    } catch (err) {
      this.logger.error('Auto-reply error', err as Error);
    }

    // Department-based routing hook (Messenger + Instagram)
    // Important: we only interpret this inbound message as a department selection
    // if a routing question had already been sent *before* this message arrived.
    // Otherwise, this message is what triggered the question and should not be
    // parsed as a numeric choice.
    try {
      const routingOutcome: RoutingOutcome | null = hadRoutingQuestionAlreadySent
        ? await this.routingService.handleInboundRouting({
            orgId,
            conversationId: conversation.id,
            customerId: customer.id,
            text,
          })
        : null;

      if (routingOutcome?.invalidSelection && reaskOnInvalidSelection && sendDepartmentQuestion) {
        const questionReplies = await this.autoReplyService.getReplies(
          orgId,
          AutoReplyTrigger.DEPARTMENT_SELECTION,
        );
        for (const reply of questionReplies) {
          await this.sendOutboundTextMessage(orgId, conversation.id, customer, reply.message);
        }
      }

      if (routingOutcome?.noAgentAvailable) {
        const noAgentReplies = await this.autoReplyService.getReplies(
          orgId,
          AutoReplyTrigger.NO_AGENT_AVAILABLE,
          routingOutcome.departmentId,
        );
        for (const reply of noAgentReplies) {
          await this.sendOutboundTextMessage(orgId, conversation.id, customer, reply.message);
        }
      }
    } catch (err) {
      this.logger.error('Routing error', err as Error);
    }
  }

  private async processRatingReply(
    orgId: string,
    conversationId: string,
    resolvedBy: string | null,
    text: string,
  ): Promise<void> {
    const trimmed = text.trim();
    const rating = Number.parseInt(trimmed, 10);

    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      this.logger.log(
        `Ignoring non-rating reply for conversation ${conversationId}: "${text}"`,
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

    this.logger.log(
      `Processed rating ${rating} for conversation ${conversationId} (org ${orgId})`,
    );
  }
  private computeIsAfterHours(settings: RoutingSettings): boolean {
    const cfg: any = settings.afterHoursConfig ?? {};
    if (!cfg.enabled) return false;

    const openTime: string | undefined = cfg.openTime;
    const closeTime: string | undefined = cfg.closeTime;
    if (!openTime || !closeTime) return false;

    const timezone: string = cfg.timezone || 'UTC';

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

      // After-hours if before open or after/equal close
      return current < openTime || current >= closeTime;
    } catch (err) {
      this.logger.error('Failed to compute after-hours state', err as Error);
      return false;
    }
  }
}
