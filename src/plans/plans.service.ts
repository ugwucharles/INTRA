import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';

export type PlanCapabilities = {
  maxSeats: number | null;
  maxConversations: number | null;
  departments: boolean;
  smartRouting: boolean;
  escalation: boolean;
  staffRating: boolean;
  analytics: boolean;
  savedReplies: boolean;
  tags: boolean;
  customerNotes: boolean;
  conversationNotes: boolean;
  businessHours: boolean;
  autoReplies: boolean;
  integrations: boolean;
  apiAccess: boolean;
};

const CAPS: Record<SubscriptionPlan, PlanCapabilities> = {
  STARTER: {
    maxSeats: 3,
    maxConversations: 100,
    departments: false,
    smartRouting: false,
    escalation: false,
    staffRating: false,
    analytics: false,
    savedReplies: true,
    tags: true,
    customerNotes: true,
    conversationNotes: true,
    businessHours: false,
    autoReplies: false,
    integrations: false,
    apiAccess: false,
  },
  GROWTH: {
    maxSeats: 10,
    maxConversations: 1000,
    departments: true,
    smartRouting: true,
    escalation: true,
    staffRating: true,
    analytics: false,
    savedReplies: true,
    tags: true,
    customerNotes: true,
    conversationNotes: true,
    businessHours: true,
    autoReplies: true,
    integrations: true,
    apiAccess: false,
  },
  BUSINESS: {
    maxSeats: null,
    maxConversations: null,
    departments: true,
    smartRouting: true,
    escalation: true,
    staffRating: true,
    analytics: true,
    savedReplies: true,
    tags: true,
    customerNotes: true,
    conversationNotes: true,
    businessHours: true,
    autoReplies: true,
    integrations: true,
    apiAccess: true,
  },
};

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  capabilities(plan: SubscriptionPlan): PlanCapabilities {
    return CAPS[plan];
  }

  async getPlan(orgId: string): Promise<SubscriptionPlan> {
    const org = await this.prisma.organization.findFirst({
      where: { id: orgId },
      select: { subscriptionPlan: true },
    });
    return org?.subscriptionPlan ?? SubscriptionPlan.STARTER;
  }

  async getCapabilitiesForOrg(orgId: string): Promise<PlanCapabilities> {
    const plan = await this.getPlan(orgId);
    return this.capabilities(plan);
  }

  async countActiveSeats(orgId: string): Promise<number> {
    return this.prisma.user.count({
      where: { orgId, isActive: true },
    });
  }

  async assertCanAddSeat(orgId: string): Promise<void> {
    const { maxSeats } = await this.getCapabilitiesForOrg(orgId);
    if (maxSeats == null) return;
    const n = await this.countActiveSeats(orgId);
    if (n >= maxSeats) {
      throw new ForbiddenException(
        `Your plan allows up to ${maxSeats} active team members. Upgrade to add more.`,
      );
    }
  }

  async assertDepartmentsEnabled(orgId: string): Promise<void> {
    const c = await this.getCapabilitiesForOrg(orgId);
    if (!c.departments) {
      throw new ForbiddenException(
        'Departments are not available on your plan. Upgrade to Growth or Business.',
      );
    }
  }

  async assertSmartRoutingSettingsAllowed(
    orgId: string,
    wantsAutoRouting: boolean,
  ): Promise<void> {
    if (!wantsAutoRouting) return;
    const c = await this.getCapabilitiesForOrg(orgId);
    if (!c.smartRouting) {
      throw new ForbiddenException(
        'Smart routing is not available on your plan. Upgrade to Growth or Business.',
      );
    }
  }

  async assertAnalyticsEnabled(orgId: string): Promise<void> {
    const c = await this.getCapabilitiesForOrg(orgId);
    if (!c.analytics) {
      throw new ForbiddenException(
        'Analytics are not available on your plan. Upgrade to Business.',
      );
    }
  }

  async assertBusinessHoursEnabled(orgId: string): Promise<void> {
    const c = await this.getCapabilitiesForOrg(orgId);
    if (!c.businessHours) {
      throw new ForbiddenException(
        'Business hours are not available on your plan. Upgrade to Growth or Business.',
      );
    }
  }

  async assertAutoRepliesEnabled(orgId: string): Promise<void> {
    const c = await this.getCapabilitiesForOrg(orgId);
    if (!c.autoReplies) {
      throw new ForbiddenException(
        'Auto replies are not available on your plan. Upgrade to Growth or Business.',
      );
    }
  }

  async assertIntegrationsEnabled(orgId: string): Promise<void> {
    const c = await this.getCapabilitiesForOrg(orgId);
    if (!c.integrations) {
      throw new ForbiddenException(
        'Integrations are not available on your plan. Upgrade to Growth or Business.',
      );
    }
  }

  async assertApiAccessEnabled(orgId: string): Promise<void> {
    const c = await this.getCapabilitiesForOrg(orgId);
    if (!c.apiAccess) {
      throw new ForbiddenException(
        'API access is not available on your plan. Upgrade to Business.',
      );
    }
  }

  async assertCanCreateConversation(orgId: string): Promise<void> {
    const { maxConversations } = await this.getCapabilitiesForOrg(orgId);
    if (maxConversations == null) return;
    const count = await this.prisma.conversation.count({
      where: { orgId },
    });
    if (count >= maxConversations) {
      throw new ForbiddenException(
        `Your plan allows up to ${maxConversations} conversations. Upgrade to add more.`,
      );
    }
  }
}
