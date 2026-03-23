import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { $Enums } from '@prisma/client';
import { MetaService } from '../meta/meta.service';
import { EmailService } from '../email/email.service';
import { SocketGateway } from '../socket/socket.gateway';
export declare class MessagesService {
    private readonly prisma;
    private readonly metaService;
    private readonly emailService;
    private readonly socketGateway;
    private readonly logger;
    constructor(prisma: PrismaService, metaService: MetaService, emailService: EmailService, socketGateway: SocketGateway);
    createMessage(currentUser: JwtPayload, conversationId: string, dto: CreateMessageDto): Promise<{
        id: string;
        createdAt: Date;
        externalId: string | null;
        status: $Enums.MessageStatus;
        senderType: $Enums.SenderType;
        senderId: string | null;
        content: string;
        retryCount: number;
        conversationId: string;
    }>;
    listMessages(currentUser: JwtPayload, conversationId: string): Promise<{
        id: string;
        createdAt: Date;
        externalId: string | null;
        status: $Enums.MessageStatus;
        senderType: $Enums.SenderType;
        senderId: string | null;
        content: string;
        retryCount: number;
        conversationId: string;
    }[]>;
}
