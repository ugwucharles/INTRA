"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaModule = void 0;
const common_1 = require("@nestjs/common");
const meta_controller_1 = require("./meta.controller");
const meta_service_1 = require("./meta.service");
const meta_outbound_queue_1 = require("./meta.outbound-queue");
const prisma_module_1 = require("../prisma/prisma.module");
const routing_module_1 = require("../routing/routing.module");
const socket_module_1 = require("../socket/socket.module");
const social_accounts_module_1 = require("../social-accounts/social-accounts.module");
let MetaModule = class MetaModule {
};
exports.MetaModule = MetaModule;
exports.MetaModule = MetaModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, routing_module_1.RoutingModule, socket_module_1.SocketModule, social_accounts_module_1.SocialAccountsModule],
        controllers: [meta_controller_1.MetaController],
        providers: [meta_service_1.MetaService, meta_outbound_queue_1.MetaOutboundQueue],
        exports: [meta_service_1.MetaService],
    })
], MetaModule);
//# sourceMappingURL=meta.module.js.map