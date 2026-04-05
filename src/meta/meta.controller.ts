import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { MetaService } from './meta.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { MetaDeleteDataDto } from './dto/delete-data.dto';

@Controller('meta')
export class MetaController {
  private readonly logger = new Logger(MetaController.name);

  constructor(private readonly metaService: MetaService) {}

  // Verification endpoint used by Meta when configuring the webhook.
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string | undefined,
    @Query('hub.verify_token') token: string | undefined,
    @Query('hub.challenge') challenge: string | undefined,
    @Res() res: Response,
  ) {
    const verifyToken = process.env.META_VERIFY_TOKEN;

    if (!verifyToken) {
      this.logger.error('META_VERIFY_TOKEN is not set');
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Server misconfigured');
    }

    if (mode === 'subscribe' && token === verifyToken && challenge) {
      this.logger.log('Meta webhook verified successfully');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn('Meta webhook verification failed', { mode, token });
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  // Webhook receiver for Facebook/Instagram messages.
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-hub-signature-256') signatureHeader: string | undefined,
  ) {
    // Log at INFO level so we can see if POSTs are actually hitting the backend.
    this.logger.log('Meta webhook POST received', JSON.stringify(body));

    const objectType = body?.object as string | undefined;

    // Choose the appropriate app secret based on the webhook object type.
    // - Messenger/Page webhooks: use META_APP_SECRET
    // - Instagram webhooks: use INSTAGRAM_APP_SECRET when provided, fallback to META_APP_SECRET
    let appSecret = process.env.META_APP_SECRET;
    if (objectType === 'instagram' && process.env.INSTAGRAM_APP_SECRET) {
      appSecret = process.env.INSTAGRAM_APP_SECRET;
    }

    if (!appSecret) {
      this.logger.error(
        'App secret is not set; cannot verify webhook signatures',
      );
      throw new ForbiddenException('Webhook not configured');
    }

    const rawBody = (req as any).rawBody as Buffer | undefined;
    if (!rawBody) {
      this.logger.warn('Missing rawBody on request; rejecting webhook');
      throw new ForbiddenException('Invalid webhook payload');
    }

    if (!signatureHeader) {
      this.logger.warn('Missing X-Hub-Signature-256 header');
      throw new ForbiddenException('Invalid webhook signature');
    }

    const [algo, receivedSignature] = signatureHeader.split('=', 2);
    if (algo !== 'sha256' || !receivedSignature) {
      this.logger.warn('Malformed X-Hub-Signature-256 header');
      throw new ForbiddenException('Invalid webhook signature');
    }

    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(receivedSignature, 'hex');

    if (
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      this.logger.warn('Meta webhook signature verification failed');
      throw new ForbiddenException('Invalid webhook signature');
    }

    await this.metaService.handleWebhook(body);
    // Meta expects a 200 quickly; no need to return anything special.
    return { received: true };
  }

  // Manually refresh a customer's Meta profile (name/avatar).
  @Post('sync-profile/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async syncProfile(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') customerId: string,
  ) {
    return this.metaService.syncCustomerProfile(currentUser.orgId, customerId);
  }
}
