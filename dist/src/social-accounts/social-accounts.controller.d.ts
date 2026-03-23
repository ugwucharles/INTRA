import type { Response } from 'express';
import type { JwtPayload } from '../auth/jwt.strategy';
import { SocialAccountsService } from './social-accounts.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
export declare class SocialAccountsController {
    private readonly service;
    constructor(service: SocialAccountsService);
    findAll(user: JwtPayload): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        orgId: string;
        isActive: boolean;
        createdAt: Date;
        pageId: string | null;
        updatedAt: Date;
        channel: import("@prisma/client").$Enums.Channel;
        accessToken: string;
        displayName: string | null;
        appSecret: string | null;
        phoneNumberId: string | null;
    }[]>;
    create(user: JwtPayload, dto: CreateSocialAccountDto): Promise<{
        id: string;
        orgId: string;
        isActive: boolean;
        createdAt: Date;
        pageId: string | null;
        updatedAt: Date;
        channel: import("@prisma/client").$Enums.Channel;
        accessToken: string;
        displayName: string | null;
        appSecret: string | null;
        phoneNumberId: string | null;
    }>;
    update(user: JwtPayload, id: string, dto: UpdateSocialAccountDto): Promise<{
        id: string;
        orgId: string;
        isActive: boolean;
        createdAt: Date;
        pageId: string | null;
        updatedAt: Date;
        channel: import("@prisma/client").$Enums.Channel;
        accessToken: string;
        displayName: string | null;
        appSecret: string | null;
        phoneNumberId: string | null;
    }>;
    remove(user: JwtPayload, id: string): Promise<{
        success: boolean;
    }>;
    getOauthUrl(user: JwtPayload, channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM'): {
        url: string;
        redirectUri: string;
        scope: string[];
    };
    oauthCallback(code: string | undefined, state: string | undefined, res: Response): Promise<{
        url: string;
    }>;
}
