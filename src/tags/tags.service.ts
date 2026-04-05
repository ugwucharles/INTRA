import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { TagType } from '@prisma/client';

export interface CreateTagDto {
  name: string;
  type: TagType;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTags(currentUser: JwtPayload, type?: TagType) {
    return this.prisma.tag.findMany({
      where: {
        orgId: currentUser.orgId,
        ...(type && { type }),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createTag(currentUser: JwtPayload, dto: CreateTagDto) {
    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Tag name is required');
    }

    const existing = await this.prisma.tag.findFirst({
      where: {
        orgId: currentUser.orgId,
        name,
        type: dto.type,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Tag with this name already exists for this type',
      );
    }

    const tag = await this.prisma.tag.create({
      data: {
        orgId: currentUser.orgId,
        name,
        type: dto.type,
        color: dto.color ?? null,
      },
    });

    return tag;
  }

  async updateTag(currentUser: JwtPayload, id: string, dto: UpdateTagDto) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found in this organization');
    }

    const data: any = {};
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Tag name cannot be empty');
      }
      data.name = name;
    }
    if (dto.color !== undefined) {
      data.color = dto.color || null;
    }

    await this.prisma.tag.updateMany({
      where: { id: tag.id, orgId: currentUser.orgId },
      data,
    });

    const updated = await this.prisma.tag.findFirst({
      where: { id: tag.id, orgId: currentUser.orgId },
    });

    return updated;
  }

  async deleteTag(currentUser: JwtPayload, id: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, orgId: currentUser.orgId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found in this organization');
    }

    await this.prisma.conversationTag.deleteMany({
      where: { tagId: tag.id, orgId: currentUser.orgId },
    });
    await this.prisma.customerTag.deleteMany({
      where: { tagId: tag.id, orgId: currentUser.orgId },
    });
    await this.prisma.tag.deleteMany({
      where: { id: tag.id, orgId: currentUser.orgId },
    });

    return { success: true };
  }
}
