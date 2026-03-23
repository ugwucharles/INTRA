import { PrismaService } from '../prisma/prisma.service';
import { FallbackBehavior, RouteTo, RoutingSettings } from '@prisma/client';
import type { JwtPayload } from '../auth/jwt.strategy';
export interface UpdateRoutingSettingsDto {
    autoRoutingEnabled?: boolean;
    routeTo?: RouteTo;
    fallbackBehavior?: FallbackBehavior;
    afterHoursConfig?: unknown;
    metadata?: unknown;
}
export declare class RoutingSettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOrCreate(orgId: string): Promise<RoutingSettings>;
    getForOrg(currentUser: JwtPayload): Promise<RoutingSettings>;
    updateForOrg(currentUser: JwtPayload, dto: UpdateRoutingSettingsDto): Promise<RoutingSettings>;
}
