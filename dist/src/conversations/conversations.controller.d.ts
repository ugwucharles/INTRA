import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { ConversationStatus } from '@prisma/client';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class ConversationsController {
    private readonly conversationsService;
    constructor(conversationsService: ConversationsService);
    createConversation(currentUser: JwtPayload, dto: CreateConversationDto): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }>;
    listConversations(currentUser: JwtPayload): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }[]>;
    assignConversation(currentUser: JwtPayload, id: string, dto: AssignConversationDto): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }>;
    handoffConversation(currentUser: JwtPayload, id: string, body: {
        assigneeId: string;
        note?: string;
    }): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }>;
    closeConversation(currentUser: JwtPayload, id: string): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }>;
    resolveConversation(currentUser: JwtPayload, id: string): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }>;
    setStarred(currentUser: JwtPayload, id: string, body: {
        isStarred: boolean;
    }): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }>;
    updateStatus(currentUser: JwtPayload, id: string, body: {
        status: ConversationStatus;
    }): Promise<{
        id: string;
        orgId: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ConversationStatus;
        updatedAt: Date;
        unreadCount: number;
        routingQuestionSent: boolean;
        routingMetadata: import("@prisma/client/runtime/client").JsonValue | null;
        firstResponseTime: number | null;
        isStarred: boolean;
        awaitingRating: boolean;
        resolvedBy: string | null;
        customerRating: number | null;
        customerId: string;
        assignedTo: string | null;
        departmentId: string | null;
    }>;
    getConversationTags(currentUser: JwtPayload, id: string): Promise<any[]>;
    addConversationTag(currentUser: JwtPayload, id: string, body: {
        tagId: string;
    }): Promise<any[]>;
    removeConversationTag(currentUser: JwtPayload, id: string, tagId: string): Promise<any[]>;
    listConversationNotes(currentUser: JwtPayload, id: string): Promise<({
        author: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        conversationId: string;
        authorId: string;
    })[]>;
    createConversationNote(currentUser: JwtPayload, id: string, body: {
        content: string;
    }): Promise<{
        author: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        orgId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        conversationId: string;
        authorId: string;
    }>;
}
