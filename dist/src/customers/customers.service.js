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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCustomer(currentUser, dto) {
        const { name, email, phone } = dto;
        if (!email && !phone) {
            throw new common_1.BadRequestException('Either email or phone is required');
        }
        const customer = await this.prisma.customer.create({
            data: {
                orgId: currentUser.orgId,
                name: name ?? null,
                email: email ?? null,
                phone: phone ?? null,
                isSaved: true,
            },
        });
        return customer;
    }
    async listCustomers(currentUser) {
        return this.prisma.customer.findMany({
            where: {
                orgId: currentUser.orgId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getCustomerById(currentUser, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        return customer;
    }
    async updateCustomer(currentUser, customerId, dto) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.email !== undefined)
            data.email = dto.email;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        data.isSaved = true;
        const updated = await this.prisma.customer.update({
            where: { id: customer.id },
            data,
        });
        return updated;
    }
    async getCustomerNote(currentUser, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        const note = await this.prisma.customerNote.findUnique({
            where: {
                customerId_userId: {
                    customerId: customer.id,
                    userId: currentUser.userId,
                },
            },
        });
        return { content: note?.content ?? '' };
    }
    async upsertCustomerNote(currentUser, customerId, content) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        const note = await this.prisma.customerNote.upsert({
            where: {
                customerId_userId: {
                    customerId: customer.id,
                    userId: currentUser.userId,
                },
            },
            create: {
                orgId: currentUser.orgId,
                customerId: customer.id,
                userId: currentUser.userId,
                content,
            },
            update: {
                content,
            },
        });
        return { content: note.content };
    }
    async getCustomerTags(currentUser, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        const tags = await this.prisma.customerTag.findMany({
            where: { customerId: customer.id },
            include: { tag: true },
        });
        return tags.map((ct) => ct.tag);
    }
    async addCustomerTag(currentUser, customerId, tagId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        const tag = await this.prisma.tag.findFirst({
            where: { id: tagId, orgId: currentUser.orgId },
        });
        if (!tag) {
            throw new common_1.NotFoundException('Tag not found in this organization');
        }
        await this.prisma.customerTag.upsert({
            where: {
                customerId_tagId: {
                    customerId: customer.id,
                    tagId: tag.id,
                },
            },
            create: {
                customerId: customer.id,
                tagId: tag.id,
            },
            update: {},
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CUSTOMER_TAG_ADDED',
                targetId: customer.id,
                targetType: 'customer',
            },
        });
        return this.getCustomerTags(currentUser, customer.id);
    }
    async removeCustomerTag(currentUser, customerId, tagId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                orgId: currentUser.orgId,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found in this organization');
        }
        await this.prisma.customerTag.deleteMany({
            where: {
                customerId: customer.id,
                tagId,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                orgId: currentUser.orgId,
                userId: currentUser.userId,
                action: 'CUSTOMER_TAG_REMOVED',
                targetId: customer.id,
                targetType: 'customer',
            },
        });
        return this.getCustomerTags(currentUser, customer.id);
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map