import { PrismaService } from './prisma/prisma.service';
export declare class AppController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    setupVisuals(): Promise<{
        error: string;
        status?: undefined;
        orgId?: undefined;
    } | {
        status: string;
        orgId: string;
        error?: undefined;
    }>;
}
