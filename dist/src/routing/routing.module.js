"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const routing_service_1 = require("./routing.service");
const routing_settings_service_1 = require("./routing-settings.service");
const routing_settings_controller_1 = require("./routing-settings.controller");
const auto_reply_service_1 = require("../auto-reply/auto-reply.service");
const auto_reply_controller_1 = require("../auto-reply/auto-reply.controller");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let RoutingModule = class RoutingModule {
};
exports.RoutingModule = RoutingModule;
exports.RoutingModule = RoutingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [routing_settings_controller_1.RoutingSettingsController, auto_reply_controller_1.AutoReplyController],
        providers: [routing_service_1.RoutingService, routing_settings_service_1.RoutingSettingsService, auto_reply_service_1.AutoReplyService, jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard],
        exports: [routing_service_1.RoutingService, routing_settings_service_1.RoutingSettingsService, auto_reply_service_1.AutoReplyService],
    })
], RoutingModule);
//# sourceMappingURL=routing.module.js.map