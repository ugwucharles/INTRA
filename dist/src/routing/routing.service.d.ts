import { PrismaService } from '../prisma/prisma.service';
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
export declare class RoutingService {
    private readonly prisma;
    private readonly routingSettingsService;
    private readonly logger;
    constructor(prisma: PrismaService, routingSettingsService: RoutingSettingsService);
    handleInboundRouting(params: RoutingParams): Promise<RoutingOutcome | null>;
    private autoAssignConversation;
}
export {};
