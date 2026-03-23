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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
const client_1 = require("@prisma/client");
let AppController = class AppController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getHello() {
        return 'INTRA API Online';
    }
    async setupVisuals() {
        const admin = await this.prisma.user.findFirst({
            where: { email: 'visuals.dummy@intrabox.com' },
        });
        if (!admin)
            return { error: 'Admin not found' };
        await this.prisma.user.update({
            where: { id: admin.id },
            data: {
                profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                title: 'Head of Support',
            },
        });
        const orgId = admin.orgId;
        let customer1 = await this.prisma.customer.findFirst({ where: { email: 'john@example.com', orgId } });
        if (!customer1) {
            customer1 = await this.prisma.customer.create({
                data: { orgId, name: 'John Doe', email: 'john@example.com', source: client_1.Channel.WHATSAPP },
            });
        }
        const conv = await this.prisma.conversation.create({
            data: {
                orgId,
                customerId: customer1.id,
                status: client_1.ConversationStatus.OPEN,
                assignedTo: admin.id,
                messages: {
                    create: [
                        { senderType: client_1.SenderType.CUSTOMER, content: 'Where is my order #12345?' },
                        { senderType: client_1.SenderType.STAFF, senderId: admin.id, content: 'Checking that for you right now, John!' },
                    ]
                }
            }
        });
        await this.prisma.conversation.update({
            where: { id: conv.id },
            data: { firstResponseTime: 45 },
        });
        return { status: 'success', orgId };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('setup-visuals'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "setupVisuals", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map