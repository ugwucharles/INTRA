import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';

export interface CreateSavedReplyDto {
  name: string;
  shortcut?: string;
  body: string;
  departmentId?: string | null;
}

export interface UpdateSavedReplyDto {
  name?: string;
  shortcut?: string | null;
  body?: string;
  departmentId?: string | null;
  isActive?: boolean;
}

@Injectable()
export class SavedRepliesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSavedReplies(
    currentUser: JwtPayload,
    departmentId?: string | null,
  ) {
    return this.prisma.savedReply.findMany({
      where: {
        orgId: currentUser.orgId,
        ...(departmentId !== undefined && { departmentId }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSavedReply(currentUser: JwtPayload, dto: CreateSavedReplyDto) {
    const name = dto.name?.trim();
    const body = dto.body?.trim();

    if (!name) {
      throw new BadRequestException('Saved reply name is required');
    }
    if (!body) {
      throw new BadRequestException('Saved reply body is required');
    }

    const savedReply = await this.prisma.savedReply.create({
      data: {
        orgId: currentUser.orgId,
        name,
        shortcut: dto.shortcut?.trim() || null,
        body,
        departmentId: dto.departmentId ?? null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'SAVED_REPLY_CREATED',
        targetId: savedReply.id,
        targetType: 'saved_reply',
      },
    });

    return savedReply;
  }

  async updateSavedReply(
    currentUser: JwtPayload,
    id: string,
    dto: UpdateSavedReplyDto,
  ) {
    const existing = await this.prisma.savedReply.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!existing) {
      throw new NotFoundException('Saved reply not found in this organization');
    }

    const data: any = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Saved reply name cannot be empty');
      }
      data.name = name;
    }
    if (dto.body !== undefined) {
      const body = dto.body.trim();
      if (!body) {
        throw new BadRequestException('Saved reply body cannot be empty');
      }
      data.body = body;
    }
    if (dto.shortcut !== undefined) {
      data.shortcut = dto.shortcut?.trim() || null;
    }
    if (dto.departmentId !== undefined) {
      data.departmentId = dto.departmentId ?? null;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    await this.prisma.savedReply.updateMany({
      where: { id: existing.id, orgId: currentUser.orgId },
      data,
    });

    const updated = await this.prisma.savedReply.findFirst({
      where: { id: existing.id, orgId: currentUser.orgId },
    });

    if (!updated) {
      throw new NotFoundException('Saved reply not found after update');
    }

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'SAVED_REPLY_UPDATED',
        targetId: updated.id,
        targetType: 'saved_reply',
      },
    });

    return updated;
  }

  async deleteSavedReply(currentUser: JwtPayload, id: string) {
    const existing = await this.prisma.savedReply.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!existing) {
      throw new NotFoundException('Saved reply not found in this organization');
    }

    await this.prisma.savedReply.deleteMany({
      where: { id: existing.id, orgId: currentUser.orgId },
    });

    await this.prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        userId: currentUser.userId,
        action: 'SAVED_REPLY_DELETED',
        targetId: existing.id,
        targetType: 'saved_reply',
      },
    });

    return { success: true };
  }
}
