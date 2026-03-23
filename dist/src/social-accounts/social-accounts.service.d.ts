import { Channel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
export declare class SocialAccountsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private get oauthRedirectUri();
    private get frontendUrl();
    private signState;
    private verifyState;
    findAll(orgId: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    create(orgId: string, dto: CreateSocialAccountDto): Promise<{
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
    update(orgId: string, id: string, dto: UpdateSocialAccountDto): Promise<{
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
    remove(orgId: string, id: string): Promise<{
        success: boolean;
    }>;
    getOauthUrl(orgId: string, userId: string, channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM'): {
        url: string;
        redirectUri: string;
        scope: string[];
    };
    handleOauthCallback(code: string, state: string): Promise<string>;
    findOrgByPageId(pageId: string): Promise<{
        orgId: string;
        accessToken: string;
        appSecret: string | null;
        phoneNumberId: string | null;
    } | null>;
    findCredentials(orgId: string, channel: Channel): Promise<{
        accessToken: string;
        pageId: string | null;
        appSecret: string | null;
        phoneNumberId: string | null;
    } | null>;
    findOrgByPhoneNumberId(phoneNumberId: string): Promise<{
        orgId: string;
        accessToken: string;
    } | null>;
    private findOneOrFail;
}
