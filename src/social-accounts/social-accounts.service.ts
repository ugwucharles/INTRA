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

/**
 * Fields safe to return to API clients.
 * accessToken, appSecret, and phoneNumberId are NEVER exposed.
 */
const PUBLIC_SELECT = {
  id: true,
  orgId: true,
  channel: true,
  displayName: true,
  pageId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class SocialAccountsService {
  private readonly logger = new Logger(SocialAccountsService.name);
  constructor(private readonly prisma: PrismaService) {}

  private get oauthRedirectUri(): string {
    const value = this.normalizeRedirectUri(process.env.META_OAUTH_REDIRECT_URI);
    if (!value) {
      throw new InternalServerErrorException(
        'META_OAUTH_REDIRECT_URI is not configured',
      );
    }
    return value;
  }

  /**
   * Env values are sometimes copied with quotes/spaces.
   * Meta expects a strict redirect URI match for code exchange.
   */
  private normalizeRedirectUri(raw: string | undefined): string {
    if (!raw) return '';
    let value = raw.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
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
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    );
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
      select: PUBLIC_SELECT,
    });
  }

  async create(orgId: string, dto: CreateSocialAccountDto) {
    if (dto.pageId) {
      const pageInUse = await this.prisma.socialAccount.findFirst({
        where: { pageId: dto.pageId, orgId: { not: orgId } },
      });
      if (pageInUse) {
        throw new ConflictException(
          'This Page is already connected to another organization.',
        );
      }
    }
    // We remove the check that prevents multiple accounts of the same channel
    // for the same organization, as we now support multiple pages.
    const created = await this.prisma.socialAccount.create({
      data: { orgId, ...dto },
    });
    return this.toPublic(created);
  }

  async update(orgId: string, id: string, dto: UpdateSocialAccountDto) {
    await this.findOneOrFail(orgId, id);
    await this.prisma.socialAccount.updateMany({
      where: { id, orgId },
      data: dto,
    });
    const updated = await this.prisma.socialAccount.findFirst({
      where: { id, orgId },
      select: PUBLIC_SELECT,
    });
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

  async repair(orgId: string, id: string) {
    const account = await this.findOneOrFail(orgId, id);

    if (
      account.channel === Channel.FACEBOOK_MESSENGER &&
      account.accessToken &&
      account.pageId
    ) {
      await this.subscribePageToApp(account.accessToken, account.pageId, [
        'messages',
        'messaging_postbacks',
        'messaging_optins',
        'messaging_referrals',
      ]);
    } else if (
      account.channel === Channel.INSTAGRAM &&
      account.accessToken &&
      account.pageId
    ) {
      await this.subscribePageToApp(account.accessToken, account.pageId, [
        'messages',
        'comments',
      ]);
    }

    await this.prisma.socialAccount.updateMany({
      where: { id: account.id, orgId },
      data: { isActive: true },
    });

    const repaired = await this.prisma.socialAccount.findFirst({
      where: { id: account.id, orgId },
      select: PUBLIC_SELECT,
    });

    return repaired;
  }

  getOauthUrl(
    orgId: string,
    userId: string,
    channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM',
  ) {
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
            'pages_read_engagement',
          ]
        : [
            'pages_show_list',
            'pages_messaging',
            'pages_manage_metadata',
            'pages_read_engagement',
          ];
    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', this.oauthRedirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes.join(','));
    console.log(`[Meta OAuth] Starting OAuth flow for ${channel}`);
    console.log(`[Meta OAuth] Using redirect_uri: "${this.oauthRedirectUri}"`);
    console.log(`[Meta OAuth] Full URL: ${url.toString().substring(0, 100)}...`);

    return {
      url: url.toString(),
      redirectUri: this.oauthRedirectUri,
      scope: scopes,
    };
  }

  async handleOauthCallback(code: string, state: string) {
    const ctx = this.verifyState(state);
    this.logger.log(
      `handleOauthCallback: orgId=${ctx.orgId}, channel=${ctx.channel}`,
    );
    const appId = process.env.META_APP_ID;
    const appSecret =
      ctx.channel === 'FACEBOOK_MESSENGER'
        ? process.env.META_APP_SECRET
        : process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
    
    if (!appId || !appSecret) {
      this.logger.error(`Credentials missing: appId=${!!appId}, appSecret=${!!appSecret}`);
      throw new InternalServerErrorException(
        ctx.channel === 'FACEBOOK_MESSENGER'
          ? 'Meta app credentials (META_APP_ID/META_APP_SECRET) are not configured for Facebook'
          : 'Meta app credentials (META_APP_ID/META_APP_SECRET or INSTAGRAM_APP_SECRET) are not configured',
      );
    }

    const tokenUrl = new URL(
      'https://graph.facebook.com/v19.0/oauth/access_token',
    );
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('redirect_uri', this.oauthRedirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) {
      const body = await tokenRes.text().catch(() => '');
      this.logger.error(
        `[OAuth Failure] Status: ${tokenRes.status}, Body: ${body}`,
      );
      // We pass the meta error back in the URL so the user can see it
      const errorMsg = `Failed to exchange OAuth code. Reason: ${body}`;
      return `${this.frontendUrl}/dashboard/channels?connect=error&msg=${encodeURIComponent(errorMsg)}`;
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
      throw new BadRequestException(
        'No Facebook pages available for this account',
      );
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
        throw new ConflictException(
          `This Facebook Page is already connected to another organization (ID: ${pageInUse.orgId}). Please disconnect it from that organization first.`,
        );
      }

      // 1. Subscribe the Page to the Meta App's webhook fields before saving credentials.
      await this.subscribePageToApp(String(page.access_token), pageIdStr, [
        'messages',
        'messaging_postbacks',
        'messaging_optins',
        'messaging_referrals',
      ]);

      await this.prisma.socialAccount.upsert({
        where: {
          orgId_channel_pageId: {
            orgId: ctx.orgId,
            channel: Channel.FACEBOOK_MESSENGER,
            pageId: pageIdStr,
          },
        },
        update: {
          displayName: page.name ?? 'Facebook Page',
          accessToken: String(page.access_token),
          isActive: true,
        },
        create: {
          orgId: ctx.orgId,
          channel: Channel.FACEBOOK_MESSENGER,
          displayName: page.name ?? 'Facebook Page',
          pageId: pageIdStr,
          accessToken: String(page.access_token),
          isActive: true,
        },
      });
    } else {
      const pageWithIg = pages.find(
        (p) => p?.instagram_business_account?.id && p?.access_token,
      );
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
        throw new ConflictException(
          `This Instagram account is already connected to another organization (ID: ${pageInUse.orgId}). Please disconnect it from that organization first.`,
        );
      }

      // 1. Subscribe the Instagram account to the Meta App's webhook fields.
      // For Instagram, we use the Page Access Token associated with the IG account.
      await this.subscribePageToApp(
        String(pageWithIg.access_token),
        String(pageWithIg.id),
        ['messages', 'comments'],
      );

      await this.prisma.socialAccount.upsert({
        where: {
          orgId_channel_pageId: {
            orgId: ctx.orgId,
            channel: Channel.INSTAGRAM,
            pageId: pageIdStr,
          },
        },
        update: {
          displayName: ig.username || ig.name || pageWithIg.name || 'Instagram',
          accessToken: String(pageWithIg.access_token),
          isActive: true,
        },
        create: {
          orgId: ctx.orgId,
          channel: Channel.INSTAGRAM,
          displayName: ig.username || ig.name || pageWithIg.name || 'Instagram',
          pageId: pageIdStr,
          accessToken: String(pageWithIg.access_token),
          isActive: true,
        },
      });
    }

    return `${this.frontendUrl}/dashboard/channels?connect=success&channel=${ctx.channel}`;
  }

  // ── Internal helpers used by MetaService ──────────────────────────────

  /** Resolve an org from a Meta page/account ID (for inbound webhook routing). */
  async findOrgByPageId(pageId: string): Promise<{
    orgId: string;
    accessToken: string;
    appSecret: string | null;
    phoneNumberId: string | null;
  } | null> {
    const trimmedId = String(pageId).trim();
    this.logger.debug(`Searching for Org by PageID: "${trimmedId}"`);
    const account = await this.prisma.socialAccount.findFirst({
      where: { pageId: trimmedId, isActive: true },
      select: {
        orgId: true,
        accessToken: true,
        appSecret: true,
        phoneNumberId: true,
      },
    });
    return account ?? null;
  }

  /** Resolve credentials for a specific org + channel. */
  async findCredentials(
    orgId: string,
    channel: Channel,
    pageId?: string,
  ): Promise<{
    accessToken: string;
    pageId: string | null;
    appSecret: string | null;
    phoneNumberId: string | null;
  } | null> {
    const account = await this.prisma.socialAccount.findFirst({
      where: {
        orgId,
        channel,
        ...(pageId ? { pageId } : {}),
      },
      select: {
        accessToken: true,
        pageId: true,
        appSecret: true,
        phoneNumberId: true,
        isActive: true,
      },
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

  /**
   * Internal helper to subscribe a Facebook Page to the Meta App's webhooks.
   * This is required for Meta to send inbound message triggers to our server.
   */
  private async subscribePageToApp(
    pageAccessToken: string,
    pageId: string,
    fields: string[],
  ) {
    try {
      const url = new URL(
        `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      );
      url.searchParams.set('access_token', pageAccessToken);
      url.searchParams.set('subscribed_fields', fields.join(','));

      const res = await fetch(url.toString(), { method: 'POST' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.error(
          `Failed to subscribe Page ${pageId} to app: ${res.status} ${body}`,
        );
        // We log the error but don't necessarily block the whole connection flow,
        // although messaging won't work until this succeeds.
      } else {
        this.logger.log(
          `Successfully subscribed Page ${pageId} to Meta App webhooks`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Error subscribing Page ${pageId} to Meta App`,
        err as Error,
      );
    }
  }

  /** Internal lookup — returns full record including secrets (for server-side use). */
  private async findOneOrFail(orgId: string, id: string) {
    const account = await this.prisma.socialAccount.findFirst({
      where: { id, orgId },
    });
    if (!account) {
      throw new NotFoundException('Social account not found');
    }
    return account;
  }

  debugEnv() {
    return {
      NODE_ENV: process.env.NODE_ENV,
      META_APP_ID: !!process.env.META_APP_ID,
      META_APP_SECRET: !!process.env.META_APP_SECRET,
      INSTAGRAM_APP_SECRET: !!process.env.INSTAGRAM_APP_SECRET,
      REDIRECT_URI: this.oauthRedirectUri,
      FRONTEND_URL: this.frontendUrl,
      TIMESTAMP: new Date().toISOString(),
    };
  }

  /** Strip sensitive fields before returning to API clients. */
  private toPublic(account: { [key: string]: any }) {
    const { accessToken, appSecret, phoneNumberId, ...safe } = account;
    return safe;
  }
}
