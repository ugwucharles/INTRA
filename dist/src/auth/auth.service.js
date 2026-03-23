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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async registerAdmin(dto) {
        const { organizationName, name, email, password } = dto;
        if (!organizationName || !name || !email || !password || !dto.country || !dto.phone) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const organization = await tx.organization.create({
                    data: {
                        name: organizationName,
                        country: dto.country,
                        phone: dto.phone,
                        address: dto.address,
                        isOnboarded: true,
                    },
                });
                const user = await tx.user.create({
                    data: {
                        orgId: organization.id,
                        name,
                        email,
                        password: hashedPassword,
                        role: client_1.UserRole.ADMIN,
                        isActive: true,
                    },
                });
                const accessToken = await this.signToken(user.id, user.orgId, user.role);
                const sanitizedUser = {
                    id: user.id,
                    orgId: user.orgId,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    isOnline: user.isOnline,
                    orgOnboarded: organization.isOnboarded,
                };
                return {
                    organization: {
                        id: organization.id,
                        name: organization.name,
                    },
                    user: sanitizedUser,
                    access_token: accessToken,
                };
            });
            return result;
        }
        catch (error) {
            if (error?.code === 'P2002') {
                throw new common_1.BadRequestException('User with this email already exists in this organization');
            }
            throw error;
        }
    }
    async login(dto) {
        const { email, password } = dto;
        if (!email || !password) {
            throw new common_1.BadRequestException('Email and password are required');
        }
        const user = await this.prisma.user.findFirst({
            where: { email },
            include: { org: { select: { isOnboarded: true } } },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const accessToken = await this.signToken(user.id, user.orgId, user.role);
        const sanitizedUser = {
            id: user.id,
            orgId: user.orgId,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isOnline: user.isOnline,
            profilePicture: user.profilePicture,
            title: user.title,
            level: user.level,
            orgOnboarded: user.org?.isOnboarded ?? false,
        };
        return {
            access_token: accessToken,
            user: sanitizedUser,
        };
    }
    async getMe(currentUser) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: currentUser.userId,
                orgId: currentUser.orgId,
            },
            include: { org: { select: { isOnboarded: true } } },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User no longer exists');
        }
        return {
            id: user.id,
            orgId: user.orgId,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isOnline: user.isOnline,
            profilePicture: user.profilePicture,
            title: user.title,
            level: user.level,
            createdAt: user.createdAt,
            orgOnboarded: user.org?.isOnboarded ?? false,
        };
    }
    async updateStatus(currentUser, isOnline) {
        const user = await this.prisma.user.update({
            where: { id: currentUser.userId },
            data: { isOnline },
            include: { org: { select: { isOnboarded: true } } },
        });
        return {
            id: user.id,
            orgId: user.orgId,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isOnline: user.isOnline,
            createdAt: user.createdAt,
            orgOnboarded: user.org?.isOnboarded ?? false,
        };
    }
    async updateProfile(currentUser, dto) {
        const data = {};
        if (dto.name)
            data.name = dto.name;
        if (dto.email)
            data.email = dto.email;
        if (dto.profilePicture)
            data.profilePicture = dto.profilePicture;
        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id: currentUser.userId },
            data,
            include: { org: { select: { isOnboarded: true } } },
        });
        return {
            id: user.id,
            orgId: user.orgId,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isOnline: user.isOnline,
            profilePicture: user.profilePicture,
            title: user.title,
            level: user.level,
            createdAt: user.createdAt,
            orgOnboarded: user.org?.isOnboarded ?? false,
        };
    }
    async loginOrRegisterWithGoogle(profile) {
        const email = profile.emails?.[0]?.value?.toLowerCase().trim();
        if (!email) {
            throw new common_1.BadRequestException('Google account did not provide an email');
        }
        const displayName = profile.displayName?.trim() ||
            profile.name?.givenName?.trim() ||
            email.split('@')[0];
        const avatar = profile.photos?.[0]?.value || undefined;
        let user = await this.prisma.user.findFirst({ where: { email } });
        if (!user) {
            const orgName = `${displayName}'s Organization`;
            const randomPassword = await bcrypt.hash(`google-${profile.id}-${Date.now()}`, 10);
            const result = await this.prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({ data: { name: orgName } });
                const created = await tx.user.create({
                    data: {
                        orgId: org.id,
                        name: displayName,
                        email,
                        password: randomPassword,
                        role: client_1.UserRole.ADMIN,
                        isActive: true,
                        profilePicture: avatar,
                    },
                });
                return created;
            });
            user = result;
        }
        else if (!user.profilePicture && avatar) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { profilePicture: avatar },
            });
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is inactive');
        }
        const finalUser = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: { org: { select: { isOnboarded: true } } },
        });
        const accessToken = await this.signToken(finalUser.id, finalUser.orgId, finalUser.role);
        return {
            access_token: accessToken,
            user: {
                id: finalUser.id,
                orgId: finalUser.orgId,
                name: finalUser.name,
                email: finalUser.email,
                role: finalUser.role,
                isActive: finalUser.isActive,
                isOnline: finalUser.isOnline,
                profilePicture: finalUser.profilePicture,
                title: finalUser.title,
                level: finalUser.level,
                orgOnboarded: finalUser.org?.isOnboarded ?? false,
            },
        };
    }
    async completeOnboarding(currentUser, dto) {
        if (currentUser.role !== 'ADMIN') {
            throw new common_1.UnauthorizedException('Only admins can complete onboarding');
        }
        if (!dto.organizationName || !dto.country || !dto.phone) {
            throw new common_1.BadRequestException('Missing required fields');
        }
        const org = await this.prisma.organization.update({
            where: { id: currentUser.orgId },
            data: {
                name: dto.organizationName,
                country: dto.country,
                phone: dto.phone,
                address: dto.address,
                isOnboarded: true,
            },
        });
        return {
            id: org.id,
            name: org.name,
            isOnboarded: org.isOnboarded,
        };
    }
    async deleteOrganization(currentUser) {
        if (currentUser.role !== 'ADMIN') {
            throw new common_1.UnauthorizedException('Only admins can delete the organization');
        }
        const orgId = currentUser.orgId;
        await this.prisma.$transaction(async (tx) => {
            await tx.message.deleteMany({ where: { conversation: { orgId } } });
            await tx.conversationTag.deleteMany({ where: { conversation: { orgId } } });
            await tx.conversationNote.deleteMany({ where: { orgId } });
            await tx.conversation.deleteMany({ where: { orgId } });
            await tx.customerTag.deleteMany({ where: { customer: { orgId } } });
            await tx.customerNote.deleteMany({ where: { orgId } });
            await tx.customer.deleteMany({ where: { orgId } });
            await tx.savedReply.deleteMany({ where: { orgId } });
            await tx.autoReply.deleteMany({ where: { orgId } });
            await tx.routingSettings.deleteMany({ where: { orgId } });
            await tx.department.deleteMany({ where: { orgId } });
            await tx.socialAccount.deleteMany({ where: { orgId } });
            await tx.tag.deleteMany({ where: { orgId } });
            await tx.auditLog.deleteMany({ where: { orgId } });
            await tx.user.deleteMany({ where: { orgId } });
            await tx.organization.delete({ where: { id: orgId } });
        });
        return { success: true };
    }
    async signToken(userId, orgId, role) {
        const payload = {
            userId,
            orgId,
            role: role,
        };
        return this.jwtService.signAsync(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map