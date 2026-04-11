import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterAdminDto, OnboardDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './jwt.strategy';
import { GoogleAuthGuard } from './google-auth.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-admin')
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    return this.authService.registerAdmin(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    console.log('[Google Auth] Callback received from Google');
    const result = await this.authService.loginOrRegisterWithGoogle(
      req.user as any,
    );
    if (result.code) {
      console.log(
        `[Google Auth] Generated one-time code: ${result.code.substring(0, 8)}...`,
      );
    } else {
      console.log('[Google Auth] Falling back to direct token redirect');
    }

    const defaultFrontendUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://intrabox.com.ng'
        : 'http://localhost:3001';
    let frontendUrl = (process.env.FRONTEND_URL || defaultFrontendUrl).replace(
      /\/$/,
      '',
    );
    if (
      process.env.NODE_ENV !== 'production' &&
      /^https:\/\/localhost/i.test(frontendUrl)
    ) {
      frontendUrl = frontendUrl.replace(
        /^https:\/\/localhost/i,
        'http://localhost',
      );
    }
    const redirectUrl = result.code
      ? `${frontendUrl}/auth/google/callback?code=${encodeURIComponent(result.code)}`
      : `${frontendUrl}/auth/google/callback?token=${encodeURIComponent(result.access_token || '')}`;
    console.log(`[Google Auth] Redirecting to frontend: ${redirectUrl.substring(0, 50)}...`);
    return res.redirect(redirectUrl);
  }

  /**
   * Exchange a one-time Google OAuth authorization code for a JWT.
   * The code was generated during the Google callback redirect and is valid for 60 seconds.
   */
  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  async exchangeGoogleCode(@Body() body: { code: string }) {
    console.log(`[Google Auth] Exchange request received for code: ${body.code?.substring(0, 8)}...`);
    if (!body.code) {
      throw new BadRequestException('Authorization code is required');
    }
    return await this.authService.exchangeGoogleAuthCode(body.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    // Example protected route using orgId from the current user.
    return this.authService.getMe(user);
  }

  @Patch('status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Body() body: { isOnline: boolean },
  ) {
    return this.authService.updateStatus(user, body.isOnline);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      name?: string;
      email?: string;
      password?: string;
      profilePicture?: string;
    },
  ) {
    return this.authService.updateProfile(user, dto);
  }

  @Delete('organization')
  @UseGuards(JwtAuthGuard)
  async deleteOrganization(@CurrentUser() user: JwtPayload) {
    return this.authService.deleteOrganization(user);
  }

  @Patch('onboard')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(@CurrentUser() user: JwtPayload, @Body() dto: any) {
    return this.authService.completeOnboarding(user, dto);
  }
}
