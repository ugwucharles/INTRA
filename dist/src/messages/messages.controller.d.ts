import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    createMessage(currentUser: JwtPayload, id: string, dto: CreateMessageDto): Promise<{
        id: string;
        createdAt: Date;
        externalId: string | null;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderType: import("@prisma/client").$Enums.SenderType;
        senderId: string | null;
        content: string;
        retryCount: number;
        conversationId: string;
    }>;
    listMessages(currentUser: JwtPayload, id: string): Promise<{
        id: string;
        createdAt: Date;
        externalId: string | null;
        status: import("@prisma/client").$Enums.MessageStatus;
        senderType: import("@prisma/client").$Enums.SenderType;
        senderId: string | null;
        content: string;
        retryCount: number;
        conversationId: string;
    }[]>;
}
