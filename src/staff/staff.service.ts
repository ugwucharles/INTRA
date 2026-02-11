import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtPayload } from '../auth/jwt.strategy';
import { UserRole } from '@prisma/client';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async createStaff(currentUser: JwtPayload, dto: CreateStaffDto) {
    const { name, email, password } = dto;

    if (!name || !email || !password) {
      throw new BadRequestException('Name, email and password are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const staff = await this.prisma.user.create({
        data: {
          orgId: currentUser.orgId,
          name,
          email,
          password: hashedPassword,
          role: UserRole.AGENT,
          isActive: true,
        },
      });

      return this.sanitizeUser(staff);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Staff with this email already exists in this organization');
      }

      throw error;
    }
  }

  async listStaff(currentUser: JwtPayload) {
    const staff = await this.prisma.user.findMany({
      where: {
        orgId: currentUser.orgId,
        role: UserRole.AGENT,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { assignedConversations: true },
        },
      },
    });

    return staff.map((u) => ({
      ...this.sanitizeUser(u),
      assignedCount: u._count.assignedConversations,
    }));
  }

  async deactivateStaff(currentUser: JwtPayload, staffId: string) {
    if (!staffId) {
      throw new BadRequestException('Staff id is required');
    }

    const staff = await this.prisma.user.findFirst({
      where: {
        id: staffId,
        orgId: currentUser.orgId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found in this organization');
    }

    const updated = await this.prisma.user.update({
      where: { id: staff.id },
      data: { isActive: false },
    });

    return this.sanitizeUser(updated);
  }

  async updateStaff(currentUser: JwtPayload, staffId: string, dto: UpdateStaffDto) {
    if (!staffId) {
      throw new BadRequestException('Staff id is required');
    }

    const staff = await this.prisma.user.findFirst({
      where: {
        id: staffId,
        orgId: currentUser.orgId,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found in this organization');
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.role !== undefined) updateData.role = dto.role as UserRole;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: staff.id },
      data: updateData,
    });

    return this.sanitizeUser(updated);
  }

  private sanitizeUser(user: { [key: string]: any }) {
    // Remove sensitive fields like password before returning
    const { password, ...rest } = user;
    return rest;
  }
}
