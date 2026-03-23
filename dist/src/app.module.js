"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const staff_module_1 = require("./staff/staff.module");
const customers_module_1 = require("./customers/customers.module");
const conversations_module_1 = require("./conversations/conversations.module");
const messages_module_1 = require("./messages/messages.module");
const meta_module_1 = require("./meta/meta.module");
const health_controller_1 = require("./health/health.controller");
const departments_module_1 = require("./departments/departments.module");
const routing_module_1 = require("./routing/routing.module");
const tags_module_1 = require("./tags/tags.module");
const saved_replies_module_1 = require("./saved-replies/saved-replies.module");
const email_module_1 = require("./email/email.module");
const socket_module_1 = require("./socket/socket.module");
const social_accounts_module_1 = require("./social-accounts/social-accounts.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            staff_module_1.StaffModule,
            customers_module_1.CustomersModule,
            conversations_module_1.ConversationsModule,
            messages_module_1.MessagesModule,
            meta_module_1.MetaModule,
            departments_module_1.DepartmentsModule,
            routing_module_1.RoutingModule,
            tags_module_1.TagsModule,
            saved_replies_module_1.SavedRepliesModule,
            email_module_1.EmailModule,
            socket_module_1.SocketModule,
            social_accounts_module_1.SocialAccountsModule,
        ],
        controllers: [app_controller_1.AppController, health_controller_1.HealthController],
        providers: [
            app_service_1.AppService,
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map