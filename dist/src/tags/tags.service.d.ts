import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { TagType } from '@prisma/client';
export interface CreateTagDto {
    name: string;
    type: TagType;
    color?: string;
}
export interface UpdateTagDto {
    name?: string;
    color?: string;
}
export declare class TagsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listTags(currentUser: JwtPayload, type?: TagType): Promise<{
        id: string;
        orgId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TagType;
        color: string | null;
    }[]>;
    createTag(currentUser: JwtPayload, dto: CreateTagDto): Promise<{
        id: string;
        orgId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TagType;
        color: string | null;
    }>;
    updateTag(currentUser: JwtPayload, id: string, dto: UpdateTagDto): Promise<{
        id: string;
        orgId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.TagType;
        color: string | null;
    }>;
    deleteTag(currentUser: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
}
