import { PrismaService } from '../prisma/prisma.service';
import { $Enums } from '@prisma/client';
import { RoutingService } from '../routing/routing.service';
import { RoutingSettingsService } from '../routing/routing-settings.service';
import { AutoReplyService } from '../auto-reply/auto-reply.service';
import { SocketGateway } from '../socket/socket.gateway';
import { SocialAccountsService } from '../social-accounts/social-accounts.service';
export declare class MetaService {
    private readonly prisma;
    private readonly routingService;
    private readonly routingSettingsService;
    private readonly autoReplyService;
    private readonly socketGateway;
    private readonly socialAccounts;
    private readonly logger;
    constructor(prisma: PrismaService, routingService: RoutingService, routingSettingsService: RoutingSettingsService, autoReplyService: AutoReplyService, socketGateway: SocketGateway, socialAccounts: SocialAccountsService);
    handleWebhook(body: any): Promise<void>;
    deleteCustomerData(orgId: string, customerId: string): Promise<{
        success: boolean;
    }>;
    processOutboundJob(orgId: string, conversationId: string, customer: {
        id: string;
        source: $Enums.Channel | null;
        externalId: string | null;
        pageId: string | null;
    }, messageId: string, text: string): Promise<void>;
    private fetchMessengerName;
    private fetchInstagramName;
    sendOutboundTextMessage(orgId: string, conversationId: string, customer: {
        id: string;
        source: $Enums.Channel | null;
        externalId: string | null;
        pageId: string | null;
    }, text: string): Promise<void>;
    private sendWhatsAppTextMessage;
    private handleWhatsAppWebhookValue;
    private handleMessagingEvent;
    private processRatingReply;
    private computeIsAfterHours;
}
