# Scripts Safety Guide (Multi-Tenant)

This project is multi-tenant by `orgId`.  
If you run one-off scripts, SQL, or maintenance jobs, always scope by tenant.

## Golden Rule

- Never run write queries without a `where orgId = ...` condition on tenant data.

## Tenant Data Models

At minimum, treat these as tenant-scoped:

- `User`
- `Customer`
- `Conversation`
- `Message`
- `Department`
- `SocialAccount`
- `AutoReply`
- `SavedReply`
- `Tag`
- `ConversationNote`
- `CustomerNote`
- `AuditLog`
- `ConversationTag`
- `CustomerTag`

## Safe SQL Patterns

Use:

```sql
SELECT * FROM "User" WHERE "orgId" = $1;
UPDATE "User" SET "isActive" = false WHERE "orgId" = $1 AND "id" = $2;
DELETE FROM "Conversation" WHERE "orgId" = $1 AND "id" = $2;
```

Avoid:

```sql
UPDATE "User" SET "isActive" = false;
DELETE FROM "Conversation" WHERE "id" = $1;
```

## Safe Prisma Script Pattern

```js
await prisma.user.updateMany({
  where: { orgId, id: userId },
  data: { isActive: false },
});
```

Do not use tenant-unscoped operations in scripts.

## Pre-Run Checklist

- Confirm target `DATABASE_URL` (local vs production).
- Confirm intended `orgId`.
- Dry-run with `findMany/count` first.
- Log affected row counts before/after updates.

## Deployment Reminder

When deploying to cPanel/production, ensure both backend code and migrations are deployed:

1. Pull latest code.
2. Run `npm ci`.
3. Run `npm run db:migrate`.
4. Run `npm run db:generate`.
5. Restart app process.

