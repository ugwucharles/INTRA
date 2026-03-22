import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterAdminDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';
import { JwtPayload } from './jwt.strategy';
import { Role } from './role.enum';
import { Profile } from 'passport-google-oauth20';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async registerAdmin(dto: RegisterAdminDto) {
    const { organizationName, name, email, password } = dto;

    if (!organizationName || !name || !email || !password || !dto.country || !dto.phone) {
      throw new BadRequestException('Missing required fields');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const organization = await tx.organization.create({
          data: {
            name: organizationName,
            country: dto.country,
            phone: dto.phone,
            address: dto.address,
            isOnboarded: true,
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
          orgOnboarded: organization.isOnboarded,
        };

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
      include: { org: { select: { isOnboarded: true } } },
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
      profilePicture: user.profilePicture,
      title: user.title,
      level: user.level,
      orgOnboarded: user.org?.isOnboarded ?? false,
    };

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
      include: { org: { select: { isOnboarded: true } } },
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
      profilePicture: user.profilePicture,
      title: user.title,
      level: user.level,
      createdAt: user.createdAt,
      orgOnboarded: user.org?.isOnboarded ?? false,
    };
  }

  async updateStatus(currentUser: JwtPayload, isOnline: boolean) {
    const user = await this.prisma.user.update({
      where: { id: currentUser.userId },
      data: { isOnline },
      include: { org: { select: { isOnboarded: true } } },
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
      orgOnboarded: user.org?.isOnboarded ?? false,
    };
  }

  async updateProfile(
    currentUser: JwtPayload,
    dto: { name?: string; email?: string; password?: string; profilePicture?: string },
  ) {
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email;
    if (dto.profilePicture) data.profilePicture = dto.profilePicture;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: currentUser.userId },
      data,
      include: { org: { select: { isOnboarded: true } } },
    });

    return {
      id: user.id,
      orgId: user.orgId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isOnline: user.isOnline,
      profilePicture: user.profilePicture,
      title: user.title,
      level: user.level,
      createdAt: user.createdAt,
      orgOnboarded: user.org?.isOnboarded ?? false,
    };
  }

  async loginOrRegisterWithGoogle(profile: Profile) {
    const email = profile.emails?.[0]?.value?.toLowerCase().trim();
    if (!email) {
      throw new BadRequestException('Google account did not provide an email');
    }

    const displayName =
      profile.displayName?.trim() ||
      profile.name?.givenName?.trim() ||
      email.split('@')[0];
    const avatar = profile.photos?.[0]?.value || undefined;

    let user = await this.prisma.user.findFirst({ where: { email } });

    if (!user) {
      const orgName = `${displayName}'s Organization`;
      const randomPassword = await bcrypt.hash(`google-${profile.id}-${Date.now()}`, 10);
      const result = await this.prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({ data: { name: orgName } });
        const created = await tx.user.create({
          data: {
            orgId: org.id,
            name: displayName,
            email,
            password: randomPassword,
            role: UserRole.ADMIN,
            isActive: true,
            profilePicture: avatar,
          },
        });
        return created;
      });
      user = result;
    } else if (!user.profilePicture && avatar) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { profilePicture: avatar },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const finalUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { org: { select: { isOnboarded: true } } },
    });

    const accessToken = await this.signToken(finalUser!.id, finalUser!.orgId, finalUser!.role);
    return {
      access_token: accessToken,
      user: {
        id: finalUser!.id,
        orgId: finalUser!.orgId,
        name: finalUser!.name,
        email: finalUser!.email,
        role: finalUser!.role,
        isActive: finalUser!.isActive,
        isOnline: finalUser!.isOnline,
        profilePicture: finalUser!.profilePicture,
        title: finalUser!.title,
        level: finalUser!.level,
        orgOnboarded: finalUser!.org?.isOnboarded ?? false,
      },
    };
  }

  async completeOnboarding(currentUser: JwtPayload, dto: any) {
    if (currentUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can complete onboarding');
    }

    if (!dto.organizationName || !dto.country || !dto.phone) {
      throw new BadRequestException('Missing required fields');
    }

    const org = await this.prisma.organization.update({
      where: { id: currentUser.orgId },
      data: {
        name: dto.organizationName,
        country: dto.country,
        phone: dto.phone,
        address: dto.address,
        isOnboarded: true,
      },
    });

    return {
      id: org.id,
      name: org.name,
      isOnboarded: org.isOnboarded,
    };
  }

  async deleteOrganization(currentUser: JwtPayload) {
    if (currentUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Only admins can delete the organization');
    }

    const orgId = currentUser.orgId;

    await this.prisma.$transaction(async (tx) => {
      // Delete in order to satisfy foreign key constraints
      await tx.message.deleteMany({ where: { conversation: { orgId } } });
      await tx.conversationTag.deleteMany({ where: { conversation: { orgId } } });
      await tx.conversationNote.deleteMany({ where: { orgId } });
      await tx.conversation.deleteMany({ where: { orgId } });

      await tx.customerTag.deleteMany({ where: { customer: { orgId } } });
      await tx.customerNote.deleteMany({ where: { orgId } });
      await tx.customer.deleteMany({ where: { orgId } });

      await tx.savedReply.deleteMany({ where: { orgId } });
      await tx.autoReply.deleteMany({ where: { orgId } });
      await tx.routingSettings.deleteMany({ where: { orgId } });
      await tx.department.deleteMany({ where: { orgId } });

      await tx.socialAccount.deleteMany({ where: { orgId } });
      await tx.tag.deleteMany({ where: { orgId } });
      await tx.auditLog.deleteMany({ where: { orgId } });

      await tx.user.deleteMany({ where: { orgId } });

      await tx.organization.delete({ where: { id: orgId } });
    });

    return { success: true };
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
