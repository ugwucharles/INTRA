import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
export interface CreateSavedReplyDto {
    name: string;
    shortcut?: string;
    body: string;
    departmentId?: string | null;
}
export interface UpdateSavedReplyDto {
    name?: string;
    shortcut?: string | null;
    body?: string;
    departmentId?: string | null;
    isActive?: boolean;
}
export declare class SavedRepliesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listSavedReplies(currentUser: JwtPayload, departmentId?: string | null): Promise<{
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        shortcut: string | null;
        body: string;
    }[]>;
    createSavedReply(currentUser: JwtPayload, dto: CreateSavedReplyDto): Promise<{
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        shortcut: string | null;
        body: string;
    }>;
    updateSavedReply(currentUser: JwtPayload, id: string, dto: UpdateSavedReplyDto): Promise<{
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        shortcut: string | null;
        body: string;
    }>;
    deleteSavedReply(currentUser: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
}
