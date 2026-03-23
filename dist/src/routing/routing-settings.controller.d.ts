import { RoutingSettingsService } from './routing-settings.service';
import type { UpdateRoutingSettingsDto } from './routing-settings.service';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class RoutingSettingsController {
    private readonly routingSettingsService;
    constructor(routingSettingsService: RoutingSettingsService);
    getSettings(currentUser: JwtPayload): Promise<{
        id: string;
        orgId: string;
        autoRoutingEnabled: boolean;
        routeTo: import("@prisma/client").$Enums.RouteTo;
        fallbackBehavior: import("@prisma/client").$Enums.FallbackBehavior;
        afterHoursConfig: import("@prisma/client/runtime/client").JsonValue | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    updateSettings(currentUser: JwtPayload, dto: UpdateRoutingSettingsDto): Promise<{
        id: string;
        orgId: string;
        autoRoutingEnabled: boolean;
        routeTo: import("@prisma/client").$Enums.RouteTo;
        fallbackBehavior: import("@prisma/client").$Enums.FallbackBehavior;
        afterHoursConfig: import("@prisma/client/runtime/client").JsonValue | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
