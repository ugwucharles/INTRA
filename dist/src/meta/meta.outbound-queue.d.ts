import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { JobsOptions } from 'bullmq';
import { $Enums } from '@prisma/client';
import { MetaService } from './meta.service';
export interface OutboundJobData {
    orgId: string;
    conversationId: string;
    customer: {
        id: string;
        source: $Enums.Channel | null;
        externalId: string | null;
        pageId: string | null;
    };
    messageId: string;
    text: string;
}
export declare class MetaOutboundQueue implements OnModuleInit, OnModuleDestroy {
    private readonly metaService;
    private readonly logger;
    private connection;
    private queue;
    private worker;
    constructor(metaService: MetaService);
    onModuleInit(): Promise<void>;
    enqueue(data: OutboundJobData, options?: JobsOptions): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
