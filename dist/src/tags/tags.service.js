"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TagsService = class TagsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listTags(currentUser, type) {
        return this.prisma.tag.findMany({
            where: {
                orgId: currentUser.orgId,
                ...(type && { type }),
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createTag(currentUser, dto) {
        const name = dto.name?.trim();
        if (!name) {
            throw new common_1.BadRequestException('Tag name is required');
        }
        const existing = await this.prisma.tag.findFirst({
            where: {
                orgId: currentUser.orgId,
                name,
                type: dto.type,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Tag with this name already exists for this type');
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
    async updateTag(currentUser, id, dto) {
        const tag = await this.prisma.tag.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!tag) {
            throw new common_1.NotFoundException('Tag not found in this organization');
        }
        const data = {};
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name) {
                throw new common_1.BadRequestException('Tag name cannot be empty');
            }
            data.name = name;
        }
        if (dto.color !== undefined) {
            data.color = dto.color || null;
        }
        return this.prisma.tag.update({
            where: { id: tag.id },
            data,
        });
    }
    async deleteTag(currentUser, id) {
        const tag = await this.prisma.tag.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!tag) {
            throw new common_1.NotFoundException('Tag not found in this organization');
        }
        await this.prisma.conversationTag.deleteMany({ where: { tagId: tag.id } });
        await this.prisma.customerTag.deleteMany({ where: { tagId: tag.id } });
        await this.prisma.tag.delete({ where: { id: tag.id } });
        return { success: true };
    }
};
exports.TagsService = TagsService;
exports.TagsService = TagsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TagsService);
//# sourceMappingURL=tags.service.js.map