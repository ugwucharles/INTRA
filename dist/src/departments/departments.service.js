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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DepartmentsService = class DepartmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listDepartments(currentUser) {
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
    async createDepartment(currentUser, name) {
        const trimmed = name?.trim();
        if (!trimmed) {
            throw new common_1.BadRequestException('Department name is required');
        }
        const existing = await this.prisma.department.findFirst({
            where: { orgId: currentUser.orgId, name: trimmed },
        });
        if (existing) {
            throw new common_1.BadRequestException('A department with this name already exists');
        }
        return this.prisma.department.create({
            data: {
                orgId: currentUser.orgId,
                name: trimmed,
            },
        });
    }
    async updateDepartment(currentUser, id, data) {
        const department = await this.prisma.department.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!department) {
            throw new common_1.NotFoundException('Department not found');
        }
        const updateData = {};
        if (data.name !== undefined) {
            const trimmed = data.name.trim();
            if (!trimmed) {
                throw new common_1.BadRequestException('Department name cannot be empty');
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
    async setMembers(currentUser, id, userIds) {
        const department = await this.prisma.department.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!department) {
            throw new common_1.NotFoundException('Department not found');
        }
        if (userIds.length > 0) {
            const users = await this.prisma.user.findMany({
                where: {
                    id: { in: userIds },
                    orgId: currentUser.orgId,
                    role: client_1.UserRole.AGENT,
                },
            });
            if (users.length !== userIds.length) {
                throw new common_1.BadRequestException('One or more users are invalid for this organization');
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
    async deleteDepartment(currentUser, id) {
        const department = await this.prisma.department.findFirst({
            where: { id, orgId: currentUser.orgId },
        });
        if (!department) {
            throw new common_1.NotFoundException('Department not found');
        }
        const conversationCount = await this.prisma.conversation.count({
            where: { orgId: currentUser.orgId, departmentId: department.id },
        });
        if (conversationCount > 0) {
            throw new common_1.BadRequestException('Cannot delete department that is attached to existing conversations');
        }
        await this.prisma.department.delete({ where: { id: department.id } });
        return { success: true };
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map