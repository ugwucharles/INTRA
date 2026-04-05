import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { SocialAccountsService } from './social-accounts.service';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';

@Controller('social-accounts')
export class SocialAccountsController {
  constructor(private readonly service: SocialAccountsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.orgId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSocialAccountDto) {
    return this.service.create(user.orgId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSocialAccountDto,
  ) {
    return this.service.update(user.orgId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.orgId, id);
  }

  @Post(':id/repair')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  repair(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.repair(user.orgId, id);
  }

  @Get('oauth/url')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getOauthUrl(
    @CurrentUser() user: JwtPayload,
    @Query('channel') channel: 'FACEBOOK_MESSENGER' | 'INSTAGRAM',
  ) {
    return this.service.getOauthUrl(user.orgId, user.userId, channel);
  }

  @Get('oauth/callback')
  @Redirect()
  async oauthCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!code || !state) {
      const fallback = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/channels?connect=error`;
      return { url: fallback };
    }
    try {
      const url = await this.service.handleOauthCallback(code, state);
      return { url };
    } catch (err: any) {
      res.statusCode = 302;
      const msg = err?.message || 'Failed to connect';
      return {
        url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/channels?connect=error&msg=${encodeURIComponent(msg)}`,
      };
    }
  }
}
