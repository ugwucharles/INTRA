import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = this.jwtService.verify(token);
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
      
      if (!superAdminEmail) {
        throw new UnauthorizedException('Super admin not configured');
      }

      // Look up user from database to get their email
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { email: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.email !== superAdminEmail) {
        throw new UnauthorizedException('Not authorized as super admin');
      }

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token or not authorized');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
