import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterAdminDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { JwtPayload } from './jwt.strategy';
import { Role } from './role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerAdmin(dto: RegisterAdminDto) {
    const { organizationName, name, email, password } = dto;

    if (!organizationName || !name || !email || !password) {
      throw new BadRequestException('Missing required fields');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
          },
        });

        const user = await tx.user.create({
          data: {
            orgId: organization.id,
            name,
            email,
            password: hashedPassword,
            role: UserRole.ADMIN,
            isActive: true,
          },
        });

        const accessToken = await this.signToken(user.id, user.orgId, user.role);

        const sanitizedUser = {
          id: user.id,
          orgId: user.orgId,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isOnline: user.isOnline,
        } as const;

        return {
          organization: {
            id: organization.id,
            name: organization.name,
          },
          user: sanitizedUser,
          // Match frontend expectation: "access_token" field
          access_token: accessToken,
        };
      });

      return result;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        // Unique constraint violation (e.g., orgId + email)
        throw new BadRequestException('User with this email already exists in this organization');
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.signToken(user.id, user.orgId, user.role);

    const sanitizedUser = {
      id: user.id,
      orgId: user.orgId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isOnline: user.isOnline,
    } as const;

    // Match frontend expectation: { access_token, user }
    return {
      access_token: accessToken,
      user: sanitizedUser,
    };
  }

  async getMe(currentUser: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.userId,
        orgId: currentUser.orgId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      id: user.id,
      orgId: user.orgId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
    };
  }

  async updateStatus(currentUser: JwtPayload, isOnline: boolean) {
    const user = await this.prisma.user.update({
      where: { id: currentUser.userId },
      data: { isOnline },
    });

    return {
      id: user.id,
      orgId: user.orgId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
    };
  }

  private async signToken(userId: string, orgId: string, role: UserRole): Promise<string> {
    const payload: JwtPayload = {
      userId,
      orgId,
      role: role as unknown as Role,
    };

    return this.jwtService.signAsync(payload);
  }
}
