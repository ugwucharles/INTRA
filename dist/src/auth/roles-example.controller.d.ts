import { Role } from './role.enum';
export declare class RolesExampleController {
    adminPing(userId: string, orgId: string): {
        message: string;
        userId: string;
        orgId: string;
    };
    agentPing(userId: string, orgId: string, role: Role): {
        message: string;
        userId: string;
        orgId: string;
        role: Role;
    };
}
