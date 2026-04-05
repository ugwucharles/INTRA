import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConversationStatus,
  FallbackBehavior,
  RouteTo,
  UserRole,
} from '@prisma/client';
import { RoutingSettingsService } from './routing-settings.service';

interface RoutingParams {
  orgId: string;
  conversationId: string;
  customerId: string;
  text: string;
}

export interface RoutingOutcome {
  departmentId?: string;
  departmentName?: string;
  noAgentAvailable?: boolean;
  invalidSelection?: boolean;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly routingSettingsService: RoutingSettingsService,
  ) {}

  /**
   * Handle inbound message for routing.
   * - Sends routing question if needed
   * - Interprets reply to choose department
   * - Auto-assigns an agent in that department
   * Returns an optional outbound text to send back to the customer.
   */
  async handleInboundRouting(
    params: RoutingParams,
  ): Promise<RoutingOutcome | null> {
    const { orgId, conversationId, text } = params;

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, orgId },
    });

    if (!conversation) {
      this.logger.warn(
        `Routing: conversation ${conversationId} not found in org ${orgId}`,
      );
      return null;
    }

    const settings = await this.routingSettingsService.getOrCreate(orgId);

    if (!settings.autoRoutingEnabled) {
      this.logger.log(
        `Routing disabled for org ${orgId}; skipping auto-assignment`,
      );
      return null;
    }

    // If already routed, do nothing
    if (conversation.departmentId) {
      return null;
    }

    // Only interpret replies after a routing question/menu has been sent
    if (!conversation.routingQuestionSent) {
      return null;
    }

    // Interpret reply as department selection using numeric choices (1 = first dept, etc.)
    const normalized = text.trim();
    const choice = parseInt(normalized, 10);
    if (!Number.isInteger(choice) || choice <= 0) {
      return { invalidSelection: true };
    }

    const departments = await this.prisma.department.findMany({
      where: { orgId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const department = departments[choice - 1];
    if (!department) {
      this.logger.warn(
        `Routing: no department for choice ${choice} in org ${orgId}`,
      );
      return { invalidSelection: true };
    }

    const existingMetadata: any =
      conversation.routingMetadata &&
      typeof conversation.routingMetadata === 'object'
        ? conversation.routingMetadata
        : {};

    await this.prisma.conversation.updateMany({
      where: { id: conversation.id, orgId },
      data: {
        departmentId: department.id,
        routingMetadata: {
          ...existingMetadata,
          departmentSelection: {
            departmentId: department.id,
            source: 'MENU_REPLY',
            selectedAt: new Date(),
          },
        },
      },
    });

    const updatedConversation = await this.prisma.conversation.findFirst({
      where: { id: conversation.id, orgId },
    });

    if (!updatedConversation) {
      this.logger.warn(
        `Routing: conversation ${conversation.id} disappeared after update`,
      );
      return null;
    }

    const { assigneeId, noAgentAvailable } = await this.autoAssignConversation(
      updatedConversation.id,
      orgId,
      department.id,
      settings.routeTo,
      settings.fallbackBehavior,
    );

    this.logger.log(
      `Routing: conversation ${updatedConversation.id} in org ${orgId} routed to department ${department.name} (assignee=${assigneeId ?? 'null'})`,
    );

    return {
      departmentId: department.id,
      departmentName: department.name,
      noAgentAvailable,
    };
  }

  private async autoAssignConversation(
    conversationId: string,
    orgId: string,
    departmentId: string,
    routeTo: RouteTo,
    fallback: FallbackBehavior,
  ): Promise<{ assigneeId: string | null; noAgentAvailable: boolean }> {
    const baseWhere: any = {
      orgId,
      isActive: true,
      role: UserRole.AGENT,
      departments: { some: { id: departmentId } },
    };

    let agents = await this.prisma.user.findMany({
      where: {
        ...baseWhere,
        ...(routeTo === RouteTo.LIVE_AGENTS_ONLY ? { isOnline: true } : {}),
      },
      include: {
        _count: {
          select: {
            assignedConversations: {
              where: { status: ConversationStatus.OPEN, orgId },
            },
          },
        },
      },
    });

    // If LIVE_AGENTS_ONLY and none found, optionally fall back to any agent
    if (
      agents.length === 0 &&
      routeTo === RouteTo.LIVE_AGENTS_ONLY &&
      fallback === FallbackBehavior.ASSIGN_ANY_AGENT
    ) {
      agents = await this.prisma.user.findMany({
        where: baseWhere,
        include: {
          _count: {
            select: {
              assignedConversations: {
                where: { status: ConversationStatus.OPEN, orgId },
              },
            },
          },
        },
      });
    }

    let assigneeId: string | null = null;

    if (agents.length > 0) {
      // Least-assigned strategy
      agents.sort(
        (a, b) =>
          a._count.assignedConversations - b._count.assignedConversations,
      );
      assigneeId = agents[0].id;
    } else if (fallback === FallbackBehavior.ASSIGN_ADMIN) {
      const admin = await this.prisma.user.findFirst({
        where: { orgId, role: UserRole.ADMIN, isActive: true },
      });
      assigneeId = admin?.id ?? null;
    }

    await this.prisma.conversation.updateMany({
      where: { id: conversationId, orgId },
      data: { assignedTo: assigneeId },
    });

    const noAgentAvailable = !assigneeId;

    this.logger.log(
      `Routing: auto-assigned conversation ${conversationId} in org ${orgId} to user ${assigneeId ?? 'null'}`,
    );

    return { assigneeId, noAgentAvailable };
  }
}
