import { Injectable } from '@nestjs/common';
import { AutoReplyTrigger, AutoReply } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class AutoReplyService {
  constructor(private readonly prisma: PrismaService) {}

  async listForOrg(currentUser: JwtPayload): Promise<AutoReply[]> {
    return this.prisma.autoReply.findMany({
      where: { orgId: currentUser.orgId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createForOrg(
    currentUser: JwtPayload,
    data: {
      trigger: AutoReplyTrigger;
      departmentId?: string | null;
      message: string;
      isActive?: boolean;
    },
  ): Promise<AutoReply> {
    return this.prisma.autoReply.create({
      data: {
        orgId: currentUser.orgId,
        trigger: data.trigger,
        departmentId: data.departmentId ?? null,
        message: data.message,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateForOrg(
    currentUser: JwtPayload,
    id: string,
    data: {
      trigger?: AutoReplyTrigger;
      departmentId?: string | null;
      message?: string;
      isActive?: boolean;
    },
  ): Promise<AutoReply> {
    const existing = await this.prisma.autoReply.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!existing) {
      throw new Error('AutoReply not found in this organization');
    }

    await this.prisma.autoReply.updateMany({
      where: { id: existing.id, orgId: currentUser.orgId },
      data: {
        ...(data.trigger !== undefined && { trigger: data.trigger }),
        ...(data.departmentId !== undefined && {
          departmentId: data.departmentId,
        }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    const updated = await this.prisma.autoReply.findFirst({
      where: { id: existing.id, orgId: currentUser.orgId },
    });

    if (!updated) {
      throw new Error('AutoReply not found after update');
    }

    return updated;
  }

  async getReplies(
    orgId: string,
    trigger: AutoReplyTrigger,
    departmentId?: string | null,
  ): Promise<AutoReply[]> {
    const where: any = {
      orgId,
      trigger,
      isActive: true,
    };

    if (departmentId) {
      // Prefer department-specific replies but also allow org-wide ones (departmentId null)
      where.OR = [{ departmentId }, { departmentId: null }];
    }

    return this.prisma.autoReply.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }
}
