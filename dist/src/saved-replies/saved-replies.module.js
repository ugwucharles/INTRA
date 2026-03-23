"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedRepliesModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const saved_replies_service_1 = require("./saved-replies.service");
const saved_replies_controller_1 = require("./saved-replies.controller");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
let SavedRepliesModule = class SavedRepliesModule {
};
exports.SavedRepliesModule = SavedRepliesModule;
exports.SavedRepliesModule = SavedRepliesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [saved_replies_controller_1.SavedRepliesController],
        providers: [saved_replies_service_1.SavedRepliesService, jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard],
    })
], SavedRepliesModule);
//# sourceMappingURL=saved-replies.module.js.map