import { AutoReplyTrigger, AutoReply } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class AutoReplyService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForOrg(currentUser: JwtPayload): Promise<AutoReply[]>;
    createForOrg(currentUser: JwtPayload, data: {
        trigger: AutoReplyTrigger;
        departmentId?: string | null;
        message: string;
        isActive?: boolean;
    }): Promise<AutoReply>;
    updateForOrg(currentUser: JwtPayload, id: string, data: {
        trigger?: AutoReplyTrigger;
        departmentId?: string | null;
        message?: string;
        isActive?: boolean;
    }): Promise<AutoReply>;
    getReplies(orgId: string, trigger: AutoReplyTrigger, departmentId?: string | null): Promise<AutoReply[]>;
}
