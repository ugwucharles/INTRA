import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlansService } from '../plans/plans.service';
import { FallbackBehavior, RouteTo, RoutingSettings } from '@prisma/client';
import type { JwtPayload } from '../auth/jwt.strategy';

export interface UpdateRoutingSettingsDto {
  autoRoutingEnabled?: boolean;
  routeTo?: RouteTo;
  fallbackBehavior?: FallbackBehavior;
  afterHoursConfig?: unknown;
  metadata?: unknown;
}

@Injectable()
export class RoutingSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plans: PlansService,
  ) {}

  async getOrCreate(orgId: string): Promise<RoutingSettings> {
    let settings = await this.prisma.routingSettings.findFirst({
      where: { orgId },
    });

    if (!settings) {
      settings = await this.prisma.routingSettings.create({
        data: { orgId },
      });
    }

    return settings;
  }

  async getForOrg(currentUser: JwtPayload): Promise<RoutingSettings> {
    return this.getOrCreate(currentUser.orgId);
  }

  async updateForOrg(
    currentUser: JwtPayload,
    dto: UpdateRoutingSettingsDto,
  ): Promise<RoutingSettings> {
    const existing = await this.getOrCreate(currentUser.orgId);

    if (dto.autoRoutingEnabled === true) {
      await this.plans.assertSmartRoutingSettingsAllowed(
        currentUser.orgId,
        true,
      );
    }

    // orgId is unique for RoutingSettings, but we still use updateMany to satisfy tenant enforcement.
    await this.prisma.routingSettings.updateMany({
      where: { orgId: existing.orgId },
      data: {
        ...(dto.autoRoutingEnabled !== undefined && {
          autoRoutingEnabled: dto.autoRoutingEnabled,
        }),
        ...(dto.routeTo !== undefined && { routeTo: dto.routeTo }),
        ...(dto.fallbackBehavior !== undefined && {
          fallbackBehavior: dto.fallbackBehavior,
        }),
        ...(dto.afterHoursConfig !== undefined && {
          afterHoursConfig: dto.afterHoursConfig as any,
        }),
        ...(dto.metadata !== undefined && {
          metadata: dto.metadata as any,
        }),
      },
    });

    const updated = await this.prisma.routingSettings.findFirst({
      where: { orgId: existing.orgId },
    });
    if (!updated) {
      // Should never happen; if it does, avoid leaking details.
      throw new Error('Failed to update routing settings');
    }
    return updated;
  }
}
