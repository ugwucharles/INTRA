import { DepartmentsService } from './departments.service';
import type { JwtPayload } from '../auth/jwt.strategy';
declare class CreateDepartmentDto {
    name: string;
}
declare class UpdateDepartmentDto {
    name?: string;
    isActive?: boolean;
}
declare class UpdateDepartmentMembersDto {
    userIds: string[];
}
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    list(currentUser: JwtPayload): Promise<({
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
    create(currentUser: JwtPayload, dto: CreateDepartmentDto): Promise<{
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(currentUser: JwtPayload, id: string, dto: UpdateDepartmentDto): Promise<{
        id: string;
        orgId: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    setMembers(currentUser: JwtPayload, id: string, dto: UpdateDepartmentMembersDto): Promise<{
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
export {};
