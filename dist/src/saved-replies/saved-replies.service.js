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
exports.SavedRepliesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SavedRepliesService = class SavedRepliesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listSavedReplies(currentUser, departmentId) {
        return this.prisma.savedReply.findMany({
            where: {
                orgId: currentUser.orgId,
                ...(departmentId !== undefined && { departmentId }),
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createSavedReply(currentUser, dto) {
        const name = dto.name?.trim();
        const body = dto.body?.trim();
        if (!name) {
            throw new common_1.BadRequestException('Saved reply name is required');
        }
        if (!body) {
            throw new common_1.BadRequestException('Saved reply body is required');
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
    async updateSavedReply(currentUser, id, dto) {
        const existing = await this.prisma.savedReply.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Saved reply not found in this organization');
        }
        const data = {};
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name) {
                throw new common_1.BadRequestException('Saved reply name cannot be empty');
            }
            data.name = name;
        }
        if (dto.body !== undefined) {
            const body = dto.body.trim();
            if (!body) {
                throw new common_1.BadRequestException('Saved reply body cannot be empty');
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
        const updated = await this.prisma.savedReply.update({
            where: { id: existing.id },
            data,
        });
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
    async deleteSavedReply(currentUser, id) {
        const existing = await this.prisma.savedReply.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Saved reply not found in this organization');
        }
        await this.prisma.savedReply.delete({ where: { id: existing.id } });
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
};
exports.SavedRepliesService = SavedRepliesService;
exports.SavedRepliesService = SavedRepliesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SavedRepliesService);
//# sourceMappingURL=saved-replies.service.js.map