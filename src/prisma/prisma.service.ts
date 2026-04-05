import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../tenancy/tenant-context';

/**
 * Models whose compound unique key already includes orgId.
 * Upsert on these is tenant-safe and does NOT need to be blocked.
 */
const ORG_SCOPED_UNIQUE_MODELS = new Set([
  'SocialAccount', // @@unique([orgId, channel, pageId])
  'RoutingSettings', // orgId @unique
  'User', // @@unique([orgId, email])
  'Customer', // @@unique([orgId, source, externalId])
]);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter });

    // Build the tenant-scoping extension.
    const extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({
            model,
            operation,
            args,
            query,
          }: {
            model: string;
            operation: string;
            args: any;
            query: (args: any) => Promise<any>;
          }): Promise<any> {
            if (TenantContext.isBypassEnabled()) {
              return query(args);
            }

            const orgId = TenantContext.getOrgId();
            if (!orgId) {
              return query(args);
            }

            // Determine whether this model has an orgId field.
            const runtimeModel: any =
              this?._runtimeDataModel?.models?.[model] ??
              this?._runtimeDataModel?.models?.find?.(
                (m: any) => m.name === model,
              );

            const fields: any[] = runtimeModel?.fields ?? [];
            const hasOrgId =
              fields.some?.((f: any) => f.name === 'orgId') ||
              !!fields.find?.((f: any) => f.name === 'orgId');

            if (!hasOrgId) {
              return query(args);
            }

            const a: any = args ?? {};

            const ensureWhereOrgId = () => {
              a.where = a.where ?? {};
              if (a.where.orgId === undefined) {
                a.where.orgId = orgId;
              }
            };

            const ensureDataOrgId = () => {
              if (!a.data) return;
              if (Array.isArray(a.data)) {
                for (const row of a.data) {
                  if (row && row.orgId === undefined) row.orgId = orgId;
                }
              } else if (typeof a.data === 'object') {
                if (a.data.orgId === undefined) a.data.orgId = orgId;
              }
            };

            // ── Reads ──────────────────────────────────────────
            if (
              operation === 'findMany' ||
              operation === 'findFirst' ||
              operation === 'findFirstOrThrow' ||
              operation === 'aggregate' ||
              operation === 'count' ||
              operation === 'groupBy'
            ) {
              ensureWhereOrgId();
              return query(a);
            }

            if (
              operation === 'findUnique' ||
              operation === 'findUniqueOrThrow'
            ) {
              throw new Error(
                `Tenant isolation: blocked ${model}.${operation}. ` +
                  `Use ${model}.findFirst({ where: { orgId, ... } }) instead.`,
              );
            }

            // ── Creates ────────────────────────────────────────
            if (operation === 'create' || operation === 'createMany') {
              ensureDataOrgId();
              return query(a);
            }

            // ── Upserts ────────────────────────────────────────
            // Allow upsert on models whose compound unique key already includes
            // orgId (the where clause inherently scopes to the tenant).
            if (operation === 'upsert') {
              if (ORG_SCOPED_UNIQUE_MODELS.has(model)) {
                ensureDataOrgId();
                return query(a);
              }
              throw new Error(
                `Tenant isolation: blocked ${model}.upsert. ` +
                  `Use findFirst + create/updateMany with orgId instead.`,
              );
            }

            // ── Bulk writes ────────────────────────────────────
            if (operation === 'updateMany' || operation === 'deleteMany') {
              ensureWhereOrgId();
              return query(a);
            }

            // ── Single-record writes (update / delete) ─────────
            // These accept WhereUniqueInput which cannot safely receive orgId.
            // Block them so developers use updateMany/deleteMany instead.
            if (operation === 'update' || operation === 'delete') {
              throw new Error(
                `Tenant isolation: blocked ${model}.${operation}. ` +
                  `Use ${model}.updateMany / deleteMany with orgId in where.`,
              );
            }

            return query(a);
          },
        },
      },
    });

    // IMPORTANT: Object.assign does NOT reliably copy Prisma model accessors
    // because they may be prototype getters. Use a Proxy so that all property
    // access on `this` is forwarded to the extended client first.
    const proxy = new Proxy(this, {
      get(target, prop, receiver) {
        // Prefer the extended client for all properties it exposes.
        if (prop in extendedClient) {
          return (extendedClient as any)[prop];
        }
        return Reflect.get(target, prop, receiver);
      },
    });

    // In JS, when a constructor returns a non-primitive, it becomes the
    // constructed value. NestJS DI will hold a reference to this proxy,
    // ensuring all injected PrismaService instances go through the extension.
    return proxy as any;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
