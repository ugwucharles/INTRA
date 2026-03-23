export declare class RegisterAdminDto {
    organizationName: string;
    name: string;
    email: string;
    password: string;
    country: string;
    phone: string;
    address?: string;
}
export declare class OnboardDto {
    organizationName: string;
    country: string;
    phone: string;
    address?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
