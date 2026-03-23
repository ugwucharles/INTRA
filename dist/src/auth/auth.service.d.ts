import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterAdminDto } from './dto/auth.dto';
import { JwtPayload } from './jwt.strategy';
import { Profile } from 'passport-google-oauth20';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
    getMe(currentUser: JwtPayload): Promise<{
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
    updateStatus(currentUser: JwtPayload, isOnline: boolean): Promise<{
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
    updateProfile(currentUser: JwtPayload, dto: {
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
    loginOrRegisterWithGoogle(profile: Profile): Promise<{
        access_token: string;
        user: {
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
            orgOnboarded: boolean;
        };
    }>;
    completeOnboarding(currentUser: JwtPayload, dto: any): Promise<{
        id: string;
        name: string;
        isOnboarded: boolean;
    }>;
    deleteOrganization(currentUser: JwtPayload): Promise<{
        success: boolean;
    }>;
    private signToken;
}
