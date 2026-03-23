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
var SocketGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let SocketGateway = SocketGateway_1 = class SocketGateway {
    jwtService;
    prisma;
    server;
    logger = new common_1.Logger(SocketGateway_1.name);
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                this.logger.warn(`Client connection rejected: No token provided. ID: ${client.id}`);
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token);
            client.data.user = payload;
            this.logger.log(`Client connected: ${client.id} Payload: ${JSON.stringify(payload)}`);
            if (payload.orgId) {
                client.join(`org_${payload.orgId}`);
            }
            await this.prisma.user.update({
                where: { id: payload.userId },
                data: { isOnline: true },
            });
            if (payload.orgId) {
                this.emitToOrg(payload.orgId, 'userStatusChanged', { userId: payload.userId, isOnline: true });
            }
        }
        catch (err) {
            this.logger.error(`Client connection rejected: Invalid token. ID: ${client.id}`);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const userPayload = client.data?.user;
        if (userPayload?.userId) {
            try {
                await this.prisma.user.update({
                    where: { id: userPayload.userId },
                    data: { isOnline: false },
                });
                if (userPayload.orgId) {
                    this.emitToOrg(userPayload.orgId, 'userStatusChanged', { userId: userPayload.userId, isOnline: false });
                }
            }
            catch (err) {
                this.logger.error(`Failed to update offline status for user ${userPayload.userId}`, err);
            }
        }
    }
    emitToOrg(orgId, event, data) {
        this.server.to(`org_${orgId}`).emit(event, data);
    }
    emitToConversation(conversationId, event, data) {
        this.server.emit(`${event}_${conversationId}`, data);
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
exports.SocketGateway = SocketGateway = SocketGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map