import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import type { JwtPayload } from '../auth/jwt.strategy';
export declare class StaffController {
    private readonly staffService;
    constructor(staffService: StaffService);
    createStaff(currentUser: JwtPayload, dto: CreateStaffDto): Promise<{
        [key: string]: any;
    }>;
    listStaff(currentUser: JwtPayload): Promise<{
        assignedCount: number;
        departments: string[];
        ratingTotal: number;
        ratingCount: number;
    }[]>;
    updateStaff(currentUser: JwtPayload, id: string, dto: UpdateStaffDto): Promise<{
        [key: string]: any;
    }>;
    deactivateStaff(currentUser: JwtPayload, id: string): Promise<{
        [key: string]: any;
    }>;
}
