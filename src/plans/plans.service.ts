import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';

export type PlanCapabilities = {
  maxSeats: number | null;
  departments: boolean;
  smartRouting: boolean;
  escalation: boolean;
  staffRating: boolean;
  analytics: boolean;
};

const CAPS: Record<SubscriptionPlan, PlanCapabilities> = {
  STARTER: {
    maxSeats: 3,
    departments: false,
    smartRouting: false,
    escalation: false,
    staffRating: false,
    analytics: false,
  },
  GROWTH: {
    maxSeats: 10,
    departments: true,
    smartRouting: true,
    escalation: true,
    staffRating: true,
    analytics: false,
  },
  BUSINESS: {
    maxSeats: null,
    departments: true,
    smartRouting: true,
    escalation: true,
    staffRating: true,
    analytics: true,
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
}
