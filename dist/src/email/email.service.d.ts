import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoutingService } from '../routing/routing.service';
import { SocketGateway } from '../socket/socket.gateway';
export declare class EmailService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly routingService;
    private readonly socketGateway;
    private readonly logger;
    private imapClient;
    private smtpTransporter;
    private lastProcessedUID;
    constructor(prisma: PrismaService, routingService: RoutingService, socketGateway: SocketGateway);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private initSmtp;
    private initImap;
    private fetchUnreadEmails;
    private handleNewEmailCount;
    private loadLastProcessedUID;
    private processIncomingEmail;
    private extractRatingFromEmailText;
    private processRatingReply;
    sendReply(orgId: string, conversationId: string, toEmail: string, text: string, messageId: string): Promise<void>;
}
