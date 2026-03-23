import { AutoReplyService } from './auto-reply.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { AutoReplyTrigger } from '@prisma/client';
declare class CreateAutoReplyDto {
    trigger: AutoReplyTrigger;
    departmentId?: string | null;
    message: string;
    isActive?: boolean;
}
declare class UpdateAutoReplyDto {
    trigger?: AutoReplyTrigger;
    departmentId?: string | null;
    message?: string;
    isActive?: boolean;
}
export declare class AutoReplyController {
    private readonly autoReplyService;
    constructor(autoReplyService: AutoReplyService);
    list(currentUser: JwtPayload): Promise<{
        id: string;
        orgId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        trigger: import("@prisma/client").$Enums.AutoReplyTrigger;
    }[]>;
    create(currentUser: JwtPayload, dto: CreateAutoReplyDto): Promise<{
        id: string;
        orgId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        trigger: import("@prisma/client").$Enums.AutoReplyTrigger;
    }>;
    update(currentUser: JwtPayload, id: string, dto: UpdateAutoReplyDto): Promise<{
        id: string;
        orgId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        departmentId: string | null;
        message: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        trigger: import("@prisma/client").$Enums.AutoReplyTrigger;
    }>;
}
export {};
