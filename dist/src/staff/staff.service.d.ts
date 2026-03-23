import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtPayload } from '../auth/jwt.strategy';
export declare class StaffService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createStaff(currentUser: JwtPayload, dto: CreateStaffDto): Promise<{
        [key: string]: any;
    }>;
    listStaff(currentUser: JwtPayload): Promise<{
        assignedCount: number;
        departments: string[];
        ratingTotal: number;
        ratingCount: number;
    }[]>;
    deactivateStaff(currentUser: JwtPayload, staffId: string): Promise<{
        [key: string]: any;
    }>;
    updateStaff(currentUser: JwtPayload, staffId: string, dto: UpdateStaffDto): Promise<{
        [key: string]: any;
    }>;
    private sanitizeUser;
}
