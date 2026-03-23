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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MetaController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaController = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const meta_service_1 = require("./meta.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const role_enum_1 = require("../auth/role.enum");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const delete_data_dto_1 = require("./dto/delete-data.dto");
let MetaController = MetaController_1 = class MetaController {
    metaService;
    logger = new common_1.Logger(MetaController_1.name);
    constructor(metaService) {
        this.metaService = metaService;
    }
    verifyWebhook(mode, token, challenge, res) {
        const verifyToken = process.env.META_VERIFY_TOKEN;
        if (!verifyToken) {
            this.logger.error('META_VERIFY_TOKEN is not set');
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).send('Server misconfigured');
        }
        if (mode === 'subscribe' && token === verifyToken && challenge) {
            this.logger.log('Meta webhook verified successfully');
            return res.status(common_1.HttpStatus.OK).send(challenge);
        }
        this.logger.warn('Meta webhook verification failed', { mode, token });
        return res.sendStatus(common_1.HttpStatus.FORBIDDEN);
    }
    async handleWebhook(req, body, signatureHeader) {
        this.logger.log('Meta webhook POST received', JSON.stringify(body));
        const objectType = body?.object;
        let appSecret = process.env.META_APP_SECRET;
        if (objectType === 'instagram' && process.env.INSTAGRAM_APP_SECRET) {
            appSecret = process.env.INSTAGRAM_APP_SECRET;
        }
        if (!appSecret) {
            this.logger.error('App secret is not set; cannot verify webhook signatures');
            throw new common_1.ForbiddenException('Webhook not configured');
        }
        const rawBody = req.rawBody;
        if (!rawBody) {
            this.logger.warn('Missing rawBody on request; rejecting webhook');
            throw new common_1.ForbiddenException('Invalid webhook payload');
        }
        if (!signatureHeader) {
            this.logger.warn('Missing X-Hub-Signature-256 header');
            throw new common_1.ForbiddenException('Invalid webhook signature');
        }
        const [algo, receivedSignature] = signatureHeader.split('=', 2);
        if (algo !== 'sha256' || !receivedSignature) {
            this.logger.warn('Malformed X-Hub-Signature-256 header');
            throw new common_1.ForbiddenException('Invalid webhook signature');
        }
        const expected = crypto
            .createHmac('sha256', appSecret)
            .update(rawBody)
            .digest('hex');
        const expectedBuf = Buffer.from(expected, 'hex');
        const receivedBuf = Buffer.from(receivedSignature, 'hex');
        if (expectedBuf.length !== receivedBuf.length ||
            !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
            this.logger.warn('Meta webhook signature verification failed');
            throw new common_1.ForbiddenException('Invalid webhook signature');
        }
        await this.metaService.handleWebhook(body);
        return { received: true };
    }
    async deleteData(currentUser, dto) {
        return this.metaService.deleteCustomerData(currentUser.orgId, dto.customerId);
    }
};
exports.MetaController = MetaController;
__decorate([
    (0, common_1.Get)('webhook'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], MetaController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('x-hub-signature-256')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MetaController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Post)('delete-data'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, delete_data_dto_1.MetaDeleteDataDto]),
    __metadata("design:returntype", Promise)
], MetaController.prototype, "deleteData", null);
exports.MetaController = MetaController = MetaController_1 = __decorate([
    (0, common_1.Controller)('meta'),
    __metadata("design:paramtypes", [meta_service_1.MetaService])
], MetaController);
//# sourceMappingURL=meta.controller.js.map