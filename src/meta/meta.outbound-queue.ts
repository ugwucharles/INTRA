import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
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

const QUEUE_NAME = 'meta-outbound';

@Injectable()
export class MetaOutboundQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetaOutboundQueue.name);
  private connection: IORedis | null = null;
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(private readonly metaService: MetaService) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('MetaOutboundQueue disabled: REDIS_URL not set');
      return;
    }

    this.connection = new IORedis(redisUrl, {
      // Required by BullMQ when using ioredis + BullMQ
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    // BullMQ's types are tied to its bundled ioredis version; at runtime any ioredis-compatible
    // client works fine, but TypeScript will see them as incompatible when two ioredis copies exist.
    this.queue = new Queue(QUEUE_NAME, { connection: this.connection as any });
  }

  async onModuleInit() {
    if (!this.connection || !this.queue) {
      // Queue is disabled (no Redis); nothing to start.
      return;
    }

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => {
        const { orgId, conversationId, customer, messageId, text } = job.data;
        await this.metaService.processOutboundJob(
          orgId,
          conversationId,
          customer,
          messageId,
          text,
        );
      },
      {
        connection: this.connection as any,
      },
    );

    this.worker.on('failed', (job, err) => {
      if (!job) return;
      this.logger.error(
        JSON.stringify({
          event: 'meta.outbound.job_failed',
          jobId: job.id,
          data: job.data,
          error: err?.message,
        }),
      );
    });
  }

  async enqueue(data: OutboundJobData, options?: JobsOptions) {
    if (!this.queue) {
      this.logger.warn(
        'MetaOutboundQueue.enqueue called but queue is disabled (no Redis connection)',
      );
      return;
    }

    await this.queue.add('send', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      ...options,
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
    await this.connection?.quit();
  }
}
