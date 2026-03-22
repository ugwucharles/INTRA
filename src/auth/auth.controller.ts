import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterAdminDto, OnboardDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './jwt.strategy';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

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
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.loginOrRegisterWithGoogle(req.user as any);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = `${frontendUrl}/auth/google/callback?token=${encodeURIComponent(result.access_token)}`;
    return res.redirect(redirectUrl);
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
    @Body() dto: { name?: string; email?: string; password?: string; profilePicture?: string },
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
