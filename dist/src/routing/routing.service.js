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
var RoutingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const routing_settings_service_1 = require("./routing-settings.service");
let RoutingService = RoutingService_1 = class RoutingService {
    prisma;
    routingSettingsService;
    logger = new common_1.Logger(RoutingService_1.name);
    constructor(prisma, routingSettingsService) {
        this.prisma = prisma;
        this.routingSettingsService = routingSettingsService;
    }
    async handleInboundRouting(params) {
        const { orgId, conversationId, text } = params;
        const conversation = await this.prisma.conversation.findFirst({
            where: { id: conversationId, orgId },
        });
        if (!conversation) {
            this.logger.warn(`Routing: conversation ${conversationId} not found in org ${orgId}`);
            return null;
        }
        const settings = await this.routingSettingsService.getOrCreate(orgId);
        if (!settings.autoRoutingEnabled) {
            this.logger.log(`Routing disabled for org ${orgId}; skipping auto-assignment`);
            return null;
        }
        if (conversation.departmentId) {
            return null;
        }
        if (!conversation.routingQuestionSent) {
            return null;
        }
        const normalized = text.trim();
        const choice = parseInt(normalized, 10);
        if (!Number.isInteger(choice) || choice <= 0) {
            return { invalidSelection: true };
        }
        const departments = await this.prisma.department.findMany({
            where: { orgId, isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        const department = departments[choice - 1];
        if (!department) {
            this.logger.warn(`Routing: no department for choice ${choice} in org ${orgId}`);
            return { invalidSelection: true };
        }
        const existingMetadata = conversation.routingMetadata && typeof conversation.routingMetadata === 'object'
            ? conversation.routingMetadata
            : {};
        const updatedConversation = await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                departmentId: department.id,
                routingMetadata: {
                    ...existingMetadata,
                    departmentSelection: {
                        departmentId: department.id,
                        source: 'MENU_REPLY',
                        selectedAt: new Date(),
                    },
                },
            },
        });
        const { assigneeId, noAgentAvailable } = await this.autoAssignConversation(updatedConversation.id, orgId, department.id, settings.routeTo, settings.fallbackBehavior);
        this.logger.log(`Routing: conversation ${updatedConversation.id} in org ${orgId} routed to department ${department.name} (assignee=${assigneeId ?? 'null'})`);
        return {
            departmentId: department.id,
            departmentName: department.name,
            noAgentAvailable,
        };
    }
    async autoAssignConversation(conversationId, orgId, departmentId, routeTo, fallback) {
        const baseWhere = {
            orgId,
            isActive: true,
            role: client_1.UserRole.AGENT,
            departments: { some: { id: departmentId } },
        };
        let agents = await this.prisma.user.findMany({
            where: {
                ...baseWhere,
                ...(routeTo === client_1.RouteTo.LIVE_AGENTS_ONLY ? { isOnline: true } : {}),
            },
            include: {
                _count: {
                    select: {
                        assignedConversations: {
                            where: { status: client_1.ConversationStatus.OPEN, orgId },
                        },
                    },
                },
            },
        });
        if (agents.length === 0 && routeTo === client_1.RouteTo.LIVE_AGENTS_ONLY && fallback === client_1.FallbackBehavior.ASSIGN_ANY_AGENT) {
            agents = await this.prisma.user.findMany({
                where: baseWhere,
                include: {
                    _count: {
                        select: {
                            assignedConversations: {
                                where: { status: client_1.ConversationStatus.OPEN, orgId },
                            },
                        },
                    },
                },
            });
        }
        let assigneeId = null;
        if (agents.length > 0) {
            agents.sort((a, b) => a._count.assignedConversations - b._count.assignedConversations);
            assigneeId = agents[0].id;
        }
        else if (fallback === client_1.FallbackBehavior.ASSIGN_ADMIN) {
            const admin = await this.prisma.user.findFirst({
                where: { orgId, role: client_1.UserRole.ADMIN, isActive: true },
            });
            assigneeId = admin?.id ?? null;
        }
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { assignedTo: assigneeId },
        });
        const noAgentAvailable = !assigneeId;
        this.logger.log(`Routing: auto-assigned conversation ${conversationId} in org ${orgId} to user ${assigneeId ?? 'null'}`);
        return { assigneeId, noAgentAvailable };
    }
};
exports.RoutingService = RoutingService;
exports.RoutingService = RoutingService = RoutingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        routing_settings_service_1.RoutingSettingsService])
], RoutingService);
//# sourceMappingURL=routing.service.js.map