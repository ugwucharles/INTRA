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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedRepliesController = void 0;
const common_1 = require("@nestjs/common");
const saved_replies_service_1 = require("./saved-replies.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const role_enum_1 = require("../auth/role.enum");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let SavedRepliesController = class SavedRepliesController {
    savedRepliesService;
    constructor(savedRepliesService) {
        this.savedRepliesService = savedRepliesService;
    }
    async listSavedReplies(currentUser, departmentId) {
        return this.savedRepliesService.listSavedReplies(currentUser, departmentId);
    }
    async createSavedReply(currentUser, dto) {
        return this.savedRepliesService.createSavedReply(currentUser, dto);
    }
    async updateSavedReply(currentUser, id, dto) {
        return this.savedRepliesService.updateSavedReply(currentUser, id, dto);
    }
    async deleteSavedReply(currentUser, id) {
        return this.savedRepliesService.deleteSavedReply(currentUser, id);
    }
};
exports.SavedRepliesController = SavedRepliesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SavedRepliesController.prototype, "listSavedReplies", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SavedRepliesController.prototype, "createSavedReply", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SavedRepliesController.prototype, "updateSavedReply", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SavedRepliesController.prototype, "deleteSavedReply", null);
exports.SavedRepliesController = SavedRepliesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
    (0, common_1.Controller)('saved-replies'),
    __metadata("design:paramtypes", [saved_replies_service_1.SavedRepliesService])
], SavedRepliesController);
//# sourceMappingURL=saved-replies.controller.js.map