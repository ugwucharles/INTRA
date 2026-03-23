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
exports.RoutingSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RoutingSettingsService = class RoutingSettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreate(orgId) {
        let settings = await this.prisma.routingSettings.findUnique({
            where: { orgId },
        });
        if (!settings) {
            settings = await this.prisma.routingSettings.create({
                data: { orgId },
            });
        }
        return settings;
    }
    async getForOrg(currentUser) {
        return this.getOrCreate(currentUser.orgId);
    }
    async updateForOrg(currentUser, dto) {
        const existing = await this.getOrCreate(currentUser.orgId);
        return this.prisma.routingSettings.update({
            where: { orgId: existing.orgId },
            data: {
                ...(dto.autoRoutingEnabled !== undefined && {
                    autoRoutingEnabled: dto.autoRoutingEnabled,
                }),
                ...(dto.routeTo !== undefined && { routeTo: dto.routeTo }),
                ...(dto.fallbackBehavior !== undefined && {
                    fallbackBehavior: dto.fallbackBehavior,
                }),
                ...(dto.afterHoursConfig !== undefined && {
                    afterHoursConfig: dto.afterHoursConfig,
                }),
                ...(dto.metadata !== undefined && {
                    metadata: dto.metadata,
                }),
            },
        });
    }
};
exports.RoutingSettingsService = RoutingSettingsService;
exports.RoutingSettingsService = RoutingSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoutingSettingsService);
//# sourceMappingURL=routing-settings.service.js.map