import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { UserRole } from '@prisma/client';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listDepartments(currentUser: JwtPayload) {
    const departments = await this.prisma.department.findMany({
      where: { orgId: currentUser.orgId },
      orderBy: { createdAt: 'asc' },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return departments;
  }

  async createDepartment(currentUser: JwtPayload, name: string) {
    const trimmed = name?.trim();
    if (!trimmed) {
      throw new BadRequestException('Department name is required');
    }

    const existing = await this.prisma.department.findFirst({
      where: { orgId: currentUser.orgId, name: trimmed },
    });

    if (existing) {
      throw new BadRequestException('A department with this name already exists');
    }

    return this.prisma.department.create({
      data: {
        orgId: currentUser.orgId,
        name: trimmed,
      },
    });
  }

  async updateDepartment(currentUser: JwtPayload, id: string, data: { name?: string; isActive?: boolean }) {
    const department = await this.prisma.department.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) {
        throw new BadRequestException('Department name cannot be empty');
      }
      updateData.name = trimmed;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    return this.prisma.department.update({
      where: { id: department.id },
      data: updateData,
    });
  }

  async setMembers(currentUser: JwtPayload, id: string, userIds: string[]) {
    const department = await this.prisma.department.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Validate users belong to the same org and are agents
    if (userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: {
          id: { in: userIds },
          orgId: currentUser.orgId,
          role: UserRole.AGENT,
        },
      });

      if (users.length !== userIds.length) {
        throw new BadRequestException('One or more users are invalid for this organization');
      }
    }

    const updated = await this.prisma.department.update({
      where: { id: department.id },
      data: {
        users: {
          set: userIds.map((userId) => ({ id: userId })),
        },
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteDepartment(currentUser: JwtPayload, id: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const conversationCount = await this.prisma.conversation.count({
      where: { orgId: currentUser.orgId, departmentId: department.id },
    });

    if (conversationCount > 0) {
      throw new BadRequestException(
        'Cannot delete department that is attached to existing conversations',
      );
    }

    await this.prisma.department.delete({ where: { id: department.id } });
    return { success: true };
  }
}
