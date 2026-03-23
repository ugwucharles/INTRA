import type { Request, Response } from 'express';
import { MetaService } from './meta.service';
import type { JwtPayload } from '../auth/jwt.strategy';
import { MetaDeleteDataDto } from './dto/delete-data.dto';
export declare class MetaController {
    private readonly metaService;
    private readonly logger;
    constructor(metaService: MetaService);
    verifyWebhook(mode: string | undefined, token: string | undefined, challenge: string | undefined, res: Response): Response<any, Record<string, any>>;
    handleWebhook(req: Request, body: any, signatureHeader: string | undefined): Promise<{
        received: boolean;
    }>;
    deleteData(currentUser: JwtPayload, dto: MetaDeleteDataDto): Promise<{
        success: boolean;
    }>;
}
