import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Channel } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

@Injectable()
export class SocialAccountsService {
  private readonly logger = new Logger(SocialAccountsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private get oauthRedirectUri(): string {
    const value = process.env.META_OAUTH_REDIRECT_URI;
    if (!value) {
      throw new InternalServerErrorException('META_OAUTH_REDIRECT_URI is not configured');
    }
    return value;
  }

  private get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3001';
  }

  private signState(payload: {
    orgId: string;
    userId: string;
    channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM';
    nonce: string;
    ts: number;
  }) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto
      .createHmac('sha256', secret)
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${sig}`;
  }

  private verifyState(raw: string): {
    orgId: string;
    userId: string;
    channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM';
    nonce: string;
    ts: number;
  } {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }
    const [encoded, sig] = raw.split('.', 2);
    if (!encoded || !sig) {
      throw new BadRequestException('Invalid OAuth state');
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(encoded)
      .digest('base64url');
    if (expected !== sig) {
      throw new BadRequestException('Invalid OAuth state signature');
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    const tooOld = Date.now() - payload.ts > 60 * 60 * 1000; // Increase to 1 hour for server clock drift
    if (tooOld) {
      throw new BadRequestException('OAuth state expired');
    }
    return payload;
  }

  findAll(orgId: string) {
    return this.prisma.socialAccount.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(orgId: string, dto: CreateSocialAccountDto) {
    if (dto.pageId) {
      const pageInUse = await this.prisma.socialAccount.findFirst({
        where: { pageId: dto.pageId, orgId: { not: orgId } },
      });
      if (pageInUse) {
        throw new ConflictException('This Page is already connected to another organization.');
      }
    }
    const existing = await this.prisma.socialAccount.findFirst({
      where: { orgId, channel: dto.channel },
    });
    if (existing) {
      throw new ConflictException(
        `A ${dto.channel} account is already connected for this organisation. Update or disconnect it first.`,
      );
    }
    return this.prisma.socialAccount.create({
      data: { orgId, ...dto },
    });
  }

  async update(orgId: string, id: string, dto: UpdateSocialAccountDto) {
    await this.findOneOrFail(orgId, id);
    await this.prisma.socialAccount.updateMany({
      where: { id, orgId },
      data: dto,
    });
    const updated = await this.prisma.socialAccount.findFirst({ where: { id, orgId } });
    if (!updated) {
      throw new NotFoundException('Social account not found');
    }
    return updated;
  }

  async remove(orgId: string, id: string) {
    await this.findOneOrFail(orgId, id);
    await this.prisma.socialAccount.deleteMany({ where: { id, orgId } });
    return { success: true };
  }

  getOauthUrl(orgId: string, userId: string, channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM') {
    const appId = process.env.META_APP_ID;
    if (!appId) {
      throw new InternalServerErrorException('META_APP_ID is not configured');
    }
    const state = this.signState({
      orgId,
      userId,
      channel,
      nonce: crypto.randomUUID(),
      ts: Date.now(),
    });
    const scopes =
      channel === 'INSTAGRAM'
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
    this.logger.log(
      `Meta OAuth start: channel=${channel} redirect_uri=${this.oauthRedirectUri} scopeCount=${scopes.length}`,
    );
    return {
      url: url.toString(),
      redirectUri: this.oauthRedirectUri,
      scope: scopes,
    };
  }

  async handleOauthCallback(code: string, state: string) {
    const ctx = this.verifyState(state);
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
      throw new InternalServerErrorException('Meta app credentials are not configured');
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
      throw new BadRequestException('Failed to exchange OAuth code');
    }
    const tokenData: any = await tokenRes.json();
    const userAccessToken: string | undefined = tokenData?.access_token;
    if (!userAccessToken) {
      throw new BadRequestException('OAuth access token missing');
    }

    const pagesUrl = new URL('https://graph.facebook.com/v19.0/me/accounts');
    pagesUrl.searchParams.set('access_token', userAccessToken);
    pagesUrl.searchParams.set(
      'fields',
      'id,name,access_token,instagram_business_account{id,username,name}',
    );
    const pagesRes = await fetch(pagesUrl.toString());
    if (!pagesRes.ok) {
      const body = await pagesRes.text().catch(() => '');
      this.logger.error(`Failed to fetch pages: ${pagesRes.status} ${body}`);
      throw new BadRequestException('Failed to fetch Facebook pages');
    }
    const pagesData: any = await pagesRes.json();
    const pages: any[] = Array.isArray(pagesData?.data) ? pagesData.data : [];
    if (pages.length === 0) {
      throw new BadRequestException('No Facebook pages available for this account');
    }

    if (ctx.channel === 'FACEBOOK_MESSENGER') {
      const page = pages.find((p) => p?.id && p?.access_token) || pages[0];
      if (!page?.id || !page?.access_token) {
        throw new BadRequestException('No page access token available');
      }

      const pageIdStr = String(page.id);
      const pageInUse = await this.prisma.socialAccount.findFirst({
        where: { pageId: pageIdStr, orgId: { not: ctx.orgId } },
      });
      if (pageInUse) {
        throw new ConflictException('This Facebook Page is already connected to another organization.');
      }

      await this.prisma.socialAccount.upsert({
        where: { orgId_channel: { orgId: ctx.orgId, channel: Channel.FACEBOOK_MESSENGER } },
        update: {
          channel: Channel.FACEBOOK_MESSENGER,
          displayName: page.name ?? 'Facebook Page',
          pageId: String(page.id),
          accessToken: String(page.access_token),
          isActive: true,
        },
        create: {
          orgId: ctx.orgId,
          channel: Channel.FACEBOOK_MESSENGER,
          displayName: page.name ?? 'Facebook Page',
          pageId: String(page.id),
          accessToken: String(page.access_token),
          isActive: true,
        },
      });
    } else {
      const pageWithIg = pages.find((p) => p?.instagram_business_account?.id && p?.access_token);
      if (!pageWithIg) {
        throw new BadRequestException(
          'No Instagram business account linked to your Facebook pages',
        );
      }
      const ig = pageWithIg.instagram_business_account;

      const pageIdStr = String(ig.id);
      const pageInUse = await this.prisma.socialAccount.findFirst({
        where: { pageId: pageIdStr, orgId: { not: ctx.orgId } },
      });
      if (pageInUse) {
        throw new ConflictException('This Instagram account is already connected to another organization.');
      }

      await this.prisma.socialAccount.upsert({
        where: { orgId_channel: { orgId: ctx.orgId, channel: Channel.INSTAGRAM } },
        update: {
          channel: Channel.INSTAGRAM,
          displayName: ig.username || ig.name || pageWithIg.name || 'Instagram',
          pageId: String(ig.id),
          accessToken: String(pageWithIg.access_token),
          isActive: true,
        },
        create: {
          orgId: ctx.orgId,
          channel: Channel.INSTAGRAM,
          displayName: ig.username || ig.name || pageWithIg.name || 'Instagram',
          pageId: String(ig.id),
          accessToken: String(pageWithIg.access_token),
          isActive: true,
        },
      });
    }

    return `${this.frontendUrl}/dashboard/channels?connect=success&channel=${ctx.channel}`;
  }

  // ── Internal helpers used by MetaService ──────────────────────────────

  /** Resolve an org from a Meta page/account ID (for inbound webhook routing). */
  async findOrgByPageId(
    pageId: string,
  ): Promise<{ orgId: string; accessToken: string; appSecret: string | null; phoneNumberId: string | null } | null> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { pageId, isActive: true },
      select: { orgId: true, accessToken: true, appSecret: true, phoneNumberId: true },
    });
    return account ?? null;
  }

  /** Resolve credentials for a specific org + channel. */
  async findCredentials(
    orgId: string,
    channel: Channel,
  ): Promise<{ accessToken: string; pageId: string | null; appSecret: string | null; phoneNumberId: string | null } | null> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { orgId, channel },
      select: { accessToken: true, pageId: true, appSecret: true, phoneNumberId: true, isActive: true },
    });
    if (!account || !account.isActive) return null;
    return account;
  }

  /** Resolve org by WhatsApp phone number ID (from webhook metadata). */
  async findOrgByPhoneNumberId(
    phoneNumberId: string,
  ): Promise<{ orgId: string; accessToken: string } | null> {
    const account = await this.prisma.socialAccount.findFirst({
      where: { phoneNumberId, isActive: true },
      select: { orgId: true, accessToken: true },
    });
    return account ?? null;
  }

  private async findOneOrFail(orgId: string, id: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id, orgId },
    });
    if (!account) {
      throw new NotFoundException('Social account not found');
    }
    return account;
  }
}
