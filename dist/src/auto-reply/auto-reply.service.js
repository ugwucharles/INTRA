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
exports.AutoReplyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AutoReplyService = class AutoReplyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listForOrg(currentUser) {
        return this.prisma.autoReply.findMany({
            where: { orgId: currentUser.orgId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async createForOrg(currentUser, data) {
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
    async updateForOrg(currentUser, id, data) {
        const existing = await this.prisma.autoReply.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!existing) {
            throw new Error('AutoReply not found in this organization');
        }
        return this.prisma.autoReply.update({
            where: { id: existing.id },
            data: {
                ...(data.trigger !== undefined && { trigger: data.trigger }),
                ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
                ...(data.message !== undefined && { message: data.message }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    }
    async getReplies(orgId, trigger, departmentId) {
        const where = {
            orgId,
            trigger,
            isActive: true,
        };
        if (departmentId) {
            where.OR = [{ departmentId }, { departmentId: null }];
        }
        return this.prisma.autoReply.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.AutoReplyService = AutoReplyService;
exports.AutoReplyService = AutoReplyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AutoReplyService);
//# sourceMappingURL=auto-reply.service.js.map