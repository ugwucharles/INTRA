import { AuthService } from './auth.service';
import { LoginDto, RegisterAdminDto } from './dto/auth.dto';
import type { JwtPayload } from './jwt.strategy';
import type { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    registerAdmin(dto: RegisterAdminDto): Promise<{
        organization: {
            id: string;
            name: string;
        };
        user: {
            id: string;
            orgId: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: boolean;
            isOnline: boolean;
            orgOnboarded: boolean;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            orgId: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            isActive: true;
            isOnline: boolean;
            profilePicture: string | null;
            title: string | null;
            level: string | null;
            orgOnboarded: boolean;
        };
    }>;
    googleAuth(): void;
    googleAuthCallback(req: Request, res: Response): Promise<void>;
    me(user: JwtPayload): Promise<{
        id: string;
        orgId: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        isOnline: boolean;
        profilePicture: string | null;
        title: string | null;
        level: string | null;
        createdAt: Date;
        orgOnboarded: boolean;
    }>;
    updateStatus(user: JwtPayload, body: {
        isOnline: boolean;
    }): Promise<{
        id: string;
        orgId: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        isOnline: boolean;
        createdAt: Date;
        orgOnboarded: boolean;
    }>;
    updateProfile(user: JwtPayload, dto: {
        name?: string;
        email?: string;
        password?: string;
        profilePicture?: string;
    }): Promise<{
        id: string;
        orgId: string;
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
        isOnline: boolean;
        profilePicture: string | null;
        title: string | null;
        level: string | null;
        createdAt: Date;
        orgOnboarded: boolean;
    }>;
    deleteOrganization(user: JwtPayload): Promise<{
        success: boolean;
    }>;
    completeOnboarding(user: JwtPayload, dto: any): Promise<{
        id: string;
        name: string;
        isOnboarded: boolean;
    }>;
}
