-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'GROWTH', 'BUSINESS');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER';

-- Existing workspaces keep full product access until you assign tiers via billing/admin.
UPDATE "Organization" SET "subscriptionPlan" = 'BUSINESS';
