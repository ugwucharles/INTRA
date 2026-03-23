import { SavedRepliesService } from './saved-replies.service';
import type { CreateSavedReplyDto, UpdateSavedReplyDto } from './saved-replies.service';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class SavedRepliesController {
    private readonly savedRepliesService;
    constructor(savedRepliesService: SavedRepliesService);
    listSavedReplies(currentUser: JwtPayload, departmentId?: string): Promise<{
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
