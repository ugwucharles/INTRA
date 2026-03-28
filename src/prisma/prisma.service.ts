import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../tenancy/tenant-context';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set');
    }
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    super({ adapter });

    // Prisma middleware ($use) is not available in this client configuration.
    // Use a query extension to enforce tenant isolation.
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

            const runtimeModel: any =
              (this as any)?._runtimeDataModel?.models?.[model] ??
              (this as any)?._runtimeDataModel?.models?.find?.((m: any) => m.name === model);

            const hasOrgId =
              !!runtimeModel?.fields?.some?.((f: any) => f.name === 'orgId') ||
              !!runtimeModel?.fields?.find?.((f: any) => f.name === 'orgId');

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

            // Reads: auto-scope
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

            // Unique reads: convert to findFirst so we can add orgId safely
            if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
              // We cannot safely inject orgId into a WhereUniqueInput. Force the codebase to use
              // a non-unique read (findFirst) for tenant-scoped lookups.
              throw new Error(
                `Tenant isolation: blocked unsafe ${model}.${operation} under tenant context. Use ${model}.findFirst({ where: { orgId: <tenant>, ... } }) instead.`,
              );
            }

            // Creates: auto-inject
            if (operation === 'create' || operation === 'createMany') {
              ensureDataOrgId();
              return query(a);
            }

            // Writes: block unsafe single-record operations (forces org-scoped patterns)
            if (operation === 'update' || operation === 'delete' || operation === 'upsert') {
              throw new Error(
                `Tenant isolation: blocked unsafe ${model}.${operation} without tenant-scoped where. Use ${model}.updateMany/deleteMany with where: { orgId: <tenant>, ... } (or explicit scoped read first).`,
              );
            }

            if (operation === 'updateMany' || operation === 'deleteMany') {
              ensureWhereOrgId();
              return query(a);
            }

            return query(a);
          },
        },
      },
    });

    // Monkey-patch this instance so existing DI sites keep working.
    Object.assign(this, extendedClient);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
