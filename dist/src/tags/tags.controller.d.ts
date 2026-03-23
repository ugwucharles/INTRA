import { TagsService } from './tags.service';
import type { CreateTagDto, UpdateTagDto } from './tags.service';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class TagsController {
    private readonly tagsService;
    constructor(tagsService: TagsService);
    listTags(currentUser: JwtPayload, type?: string): Promise<{
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
