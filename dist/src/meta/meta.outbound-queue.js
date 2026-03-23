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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MetaOutboundQueue_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaOutboundQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const meta_service_1 = require("./meta.service");
const QUEUE_NAME = 'meta-outbound';
let MetaOutboundQueue = MetaOutboundQueue_1 = class MetaOutboundQueue {
    metaService;
    logger = new common_1.Logger(MetaOutboundQueue_1.name);
    connection = null;
    queue = null;
    worker = null;
    constructor(metaService) {
        this.metaService = metaService;
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            this.logger.warn('MetaOutboundQueue disabled: REDIS_URL not set');
            return;
        }
        this.connection = new ioredis_1.default(redisUrl, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });
        this.queue = new bullmq_1.Queue(QUEUE_NAME, { connection: this.connection });
    }
    async onModuleInit() {
        if (!this.connection || !this.queue) {
            return;
        }
        this.worker = new bullmq_1.Worker(QUEUE_NAME, async (job) => {
            const { orgId, conversationId, customer, messageId, text } = job.data;
            await this.metaService.processOutboundJob(orgId, conversationId, customer, messageId, text);
        }, {
            connection: this.connection,
        });
        this.worker.on('failed', (job, err) => {
            if (!job)
                return;
            this.logger.error(JSON.stringify({
                event: 'meta.outbound.job_failed',
                jobId: job.id,
                data: job.data,
                error: err?.message,
            }));
        });
    }
    async enqueue(data, options) {
        if (!this.queue) {
            this.logger.warn('MetaOutboundQueue.enqueue called but queue is disabled (no Redis connection)');
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
};
exports.MetaOutboundQueue = MetaOutboundQueue;
exports.MetaOutboundQueue = MetaOutboundQueue = MetaOutboundQueue_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meta_service_1.MetaService])
], MetaOutboundQueue);
//# sourceMappingURL=meta.outbound-queue.js.map