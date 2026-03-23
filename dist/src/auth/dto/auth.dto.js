"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginDto = exports.OnboardDto = exports.RegisterAdminDto = void 0;
class RegisterAdminDto {
    organizationName;
    name;
    email;
    password;
    country;
    phone;
    address;
}
exports.RegisterAdminDto = RegisterAdminDto;
class OnboardDto {
    organizationName;
    country;
    phone;
    address;
}
exports.OnboardDto = OnboardDto;
class LoginDto {
    email;
    password;
}
exports.LoginDto = LoginDto;
//# sourceMappingURL=auth.dto.js.map