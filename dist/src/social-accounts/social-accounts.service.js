"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SocialAccountsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialAccountsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
let SocialAccountsService = SocialAccountsService_1 = class SocialAccountsService {
    prisma;
    logger = new common_1.Logger(SocialAccountsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    get oauthRedirectUri() {
        const value = process.env.META_OAUTH_REDIRECT_URI;
        if (!value) {
            throw new common_1.InternalServerErrorException('META_OAUTH_REDIRECT_URI is not configured');
        }
        return value;
    }
    get frontendUrl() {
        return process.env.FRONTEND_URL || 'http://localhost:3001';
    }
    signState(payload) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new common_1.InternalServerErrorException('JWT_SECRET is not configured');
        }
        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const sig = crypto
            .createHmac('sha256', secret)
            .update(encoded)
            .digest('base64url');
        return `${encoded}.${sig}`;
    }
    verifyState(raw) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new common_1.InternalServerErrorException('JWT_SECRET is not configured');
        }
        const [encoded, sig] = raw.split('.', 2);
        if (!encoded || !sig) {
            throw new common_1.BadRequestException('Invalid OAuth state');
        }
        const expected = crypto
            .createHmac('sha256', secret)
            .update(encoded)
            .digest('base64url');
        if (expected !== sig) {
            throw new common_1.BadRequestException('Invalid OAuth state signature');
        }
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        const tooOld = Date.now() - payload.ts > 10 * 60 * 1000;
        if (tooOld) {
            throw new common_1.BadRequestException('OAuth state expired');
        }
        return payload;
    }
    findAll(orgId) {
        return this.prisma.socialAccount.findMany({
            where: { orgId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async create(orgId, dto) {
        if (dto.pageId) {
            const pageInUse = await this.prisma.socialAccount.findFirst({
                where: { pageId: dto.pageId, orgId: { not: orgId } },
            });
            if (pageInUse) {
                throw new common_1.ConflictException('This Page is already connected to another organization.');
            }
        }
        const existing = await this.prisma.socialAccount.findUnique({
            where: { orgId_channel: { orgId, channel: dto.channel } },
        });
        if (existing) {
            throw new common_1.ConflictException(`A ${dto.channel} account is already connected for this organisation. Update or disconnect it first.`);
        }
        return this.prisma.socialAccount.create({
            data: { orgId, ...dto },
        });
    }
    async update(orgId, id, dto) {
        await this.findOneOrFail(orgId, id);
        return this.prisma.socialAccount.update({
            where: { id },
            data: dto,
        });
    }
    async remove(orgId, id) {
        await this.findOneOrFail(orgId, id);
        await this.prisma.socialAccount.delete({ where: { id } });
        return { success: true };
    }
    getOauthUrl(orgId, userId, channel) {
        const appId = process.env.META_APP_ID;
        if (!appId) {
            throw new common_1.InternalServerErrorException('META_APP_ID is not configured');
        }
        const state = this.signState({
            orgId,
            userId,
            channel,
            nonce: crypto.randomUUID(),
            ts: Date.now(),
        });
        const scopes = channel === 'INSTAGRAM'
            ? [
                'instagram_basic',
                'instagram_manage_messages',
                'pages_show_list',
                'pages_manage_metadata',
            ]
            : [
                'pages_show_list',
                'pages_messaging',
                'pages_manage_metadata',
            ];
        const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
        url.searchParams.set('client_id', appId);
        url.searchParams.set('redirect_uri', this.oauthRedirectUri);
        url.searchParams.set('state', state);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', scopes.join(','));
        this.logger.log(`Meta OAuth start: channel=${channel} redirect_uri=${this.oauthRedirectUri} scopeCount=${scopes.length}`);
        return {
            url: url.toString(),
            redirectUri: this.oauthRedirectUri,
            scope: scopes,
        };
    }
    async handleOauthCallback(code, state) {
        const ctx = this.verifyState(state);
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        if (!appId || !appSecret) {
            throw new common_1.InternalServerErrorException('Meta app credentials are not configured');
        }
        const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
        tokenUrl.searchParams.set('client_id', appId);
        tokenUrl.searchParams.set('client_secret', appSecret);
        tokenUrl.searchParams.set('redirect_uri', this.oauthRedirectUri);
        tokenUrl.searchParams.set('code', code);
        const tokenRes = await fetch(tokenUrl.toString());
        if (!tokenRes.ok) {
            const body = await tokenRes.text().catch(() => '');
            this.logger.error(`Failed OAuth token exchange: ${tokenRes.status} ${body}`);
            throw new common_1.BadRequestException('Failed to exchange OAuth code');
        }
        const tokenData = await tokenRes.json();
        const userAccessToken = tokenData?.access_token;
        if (!userAccessToken) {
            throw new common_1.BadRequestException('OAuth access token missing');
        }
        const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
        pagesUrl.searchParams.set('access_token', userAccessToken);
        pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account{id,username,name}');
        const pagesRes = await fetch(pagesUrl.toString());
        if (!pagesRes.ok) {
            const body = await pagesRes.text().catch(() => '');
            this.logger.error(`Failed to fetch pages: ${pagesRes.status} ${body}`);
            throw new common_1.BadRequestException('Failed to fetch Facebook pages');
        }
        const pagesData = await pagesRes.json();
        const pages = Array.isArray(pagesData?.data) ? pagesData.data : [];
        if (pages.length === 0) {
            throw new common_1.BadRequestException('No Facebook pages available for this account');
        }
        if (ctx.channel === 'FACEBOOK_MESSENGER') {
            const page = pages.find((p) => p?.id && p?.access_token) || pages[0];
            if (!page?.id || !page?.access_token) {
                throw new common_1.BadRequestException('No page access token available');
            }
            const pageIdStr = String(page.id);
            const pageInUse = await this.prisma.socialAccount.findFirst({
                where: { pageId: pageIdStr, orgId: { not: ctx.orgId } },
            });
            if (pageInUse) {
                throw new common_1.ConflictException('This Facebook Page is already connected to another organization.');
            }
            await this.prisma.socialAccount.upsert({
                where: { orgId_channel: { orgId: ctx.orgId, channel: client_1.Channel.FACEBOOK_MESSENGER } },
                update: {
                    channel: client_1.Channel.FACEBOOK_MESSENGER,
                    displayName: page.name ?? 'Facebook Page',
                    pageId: String(page.id),
                    accessToken: String(page.access_token),
                    isActive: true,
                },
                create: {
                    orgId: ctx.orgId,
                    channel: client_1.Channel.FACEBOOK_MESSENGER,
                    displayName: page.name ?? 'Facebook Page',
                    pageId: String(page.id),
                    accessToken: String(page.access_token),
                    isActive: true,
                },
            });
        }
        else {
            const pageWithIg = pages.find((p) => p?.instagram_business_account?.id && p?.access_token);
            if (!pageWithIg) {
                throw new common_1.BadRequestException('No Instagram business account linked to your Facebook pages');
            }
            const ig = pageWithIg.instagram_business_account;
            const pageIdStr = String(ig.id);
            const pageInUse = await this.prisma.socialAccount.findFirst({
                where: { pageId: pageIdStr, orgId: { not: ctx.orgId } },
            });
            if (pageInUse) {
                throw new common_1.ConflictException('This Instagram account is already connected to another organization.');
            }
            await this.prisma.socialAccount.upsert({
                where: { orgId_channel: { orgId: ctx.orgId, channel: client_1.Channel.INSTAGRAM } },
                update: {
                    channel: client_1.Channel.INSTAGRAM,
                    displayName: ig.username || ig.name || pageWithIg.name || 'Instagram',
                    pageId: String(ig.id),
                    accessToken: String(pageWithIg.access_token),
                    isActive: true,
                },
                create: {
                    orgId: ctx.orgId,
                    channel: client_1.Channel.INSTAGRAM,
                    displayName: ig.username || ig.name || pageWithIg.name || 'Instagram',
                    pageId: String(ig.id),
                    accessToken: String(pageWithIg.access_token),
                    isActive: true,
                },
            });
        }
        return `${this.frontendUrl}/dashboard/channels?connect=success&channel=${ctx.channel}`;
    }
    async findOrgByPageId(pageId) {
        const account = await this.prisma.socialAccount.findFirst({
            where: { pageId, isActive: true },
            select: { orgId: true, accessToken: true, appSecret: true, phoneNumberId: true },
        });
        return account ?? null;
    }
    async findCredentials(orgId, channel) {
        const account = await this.prisma.socialAccount.findUnique({
            where: { orgId_channel: { orgId, channel } },
            select: { accessToken: true, pageId: true, appSecret: true, phoneNumberId: true, isActive: true },
        });
        if (!account || !account.isActive)
            return null;
        return account;
    }
    async findOrgByPhoneNumberId(phoneNumberId) {
        const account = await this.prisma.socialAccount.findFirst({
            where: { phoneNumberId, isActive: true },
            select: { orgId: true, accessToken: true },
        });
        return account ?? null;
    }
    async findOneOrFail(orgId, id) {
        const account = await this.prisma.socialAccount.findFirst({
            where: { id, orgId },
        });
        if (!account) {
            throw new common_1.NotFoundException('Social account not found');
        }
        return account;
    }
};
exports.SocialAccountsService = SocialAccountsService;
exports.SocialAccountsService = SocialAccountsService = SocialAccountsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SocialAccountsService);
//# sourceMappingURL=social-accounts.service.js.map