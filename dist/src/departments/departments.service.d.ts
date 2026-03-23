import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class DepartmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listDepartments(currentUser: JwtPayload): Promise<({
        users: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
        }[];
    } & {
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    createDepartment(currentUser: JwtPayload, name: string): Promise<{
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateDepartment(currentUser: JwtPayload, id: string, data: {
        name?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    setMembers(currentUser: JwtPayload, id: string, userIds: string[]): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
        }[];
    } & {
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteDepartment(currentUser: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
}
