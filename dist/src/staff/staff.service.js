"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let StaffService = class StaffService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createStaff(currentUser, dto) {
        const { name, email, password } = dto;
        if (!name || !email || !password) {
            throw new common_1.BadRequestException('Name, email and password are required');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const staff = await this.prisma.user.create({
                data: {
                    orgId: currentUser.orgId,
                    name,
                    email,
                    password: hashedPassword,
                    role: client_1.UserRole.AGENT,
                    isActive: true,
                },
            });
            return this.sanitizeUser(staff);
        }
        catch (error) {
            if (error?.code === 'P2002') {
                throw new common_1.BadRequestException('Staff with this email already exists in this organization');
            }
            throw error;
        }
    }
    async listStaff(currentUser) {
        const staff = await this.prisma.user.findMany({
            where: {
                orgId: currentUser.orgId,
            },
            orderBy: { createdAt: 'asc' },
            include: {
                departments: {
                    select: { name: true },
                },
                _count: {
                    select: { assignedConversations: true },
                },
            },
        });
        return staff.map((u) => ({
            ...this.sanitizeUser(u),
            assignedCount: u._count.assignedConversations,
            departments: u.departments.map((d) => d.name),
            ratingTotal: u.ratingTotal,
            ratingCount: u.ratingCount,
        }));
    }
    async deactivateStaff(currentUser, staffId) {
        if (!staffId) {
            throw new common_1.BadRequestException('Staff id is required');
        }
        const staff = await this.prisma.user.findFirst({
            where: {
                id: staffId,
                orgId: currentUser.orgId,
            },
        });
        if (!staff) {
            throw new common_1.NotFoundException('Staff member not found in this organization');
        }
        const updated = await this.prisma.user.update({
            where: { id: staff.id },
            data: { isActive: false },
        });
        return this.sanitizeUser(updated);
    }
    async updateStaff(currentUser, staffId, dto) {
        if (!staffId) {
            throw new common_1.BadRequestException('Staff id is required');
        }
        const staff = await this.prisma.user.findFirst({
            where: {
                id: staffId,
                orgId: currentUser.orgId,
            },
        });
        if (!staff) {
            throw new common_1.NotFoundException('Staff member not found in this organization');
        }
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.email !== undefined)
            updateData.email = dto.email;
        if (dto.role !== undefined)
            updateData.role = dto.role;
        if (dto.isActive !== undefined)
            updateData.isActive = dto.isActive;
        if (dto.password) {
            updateData.password = await bcrypt.hash(dto.password, 10);
        }
        const updated = await this.prisma.user.update({
            where: { id: staff.id },
            data: updateData,
        });
        return this.sanitizeUser(updated);
    }
    sanitizeUser(user) {
        const { password, ...rest } = user;
        return rest;
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffService);
//# sourceMappingURL=staff.service.js.map