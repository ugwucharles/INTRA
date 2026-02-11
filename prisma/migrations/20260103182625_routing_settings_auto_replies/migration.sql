-- CreateEnum
CREATE TYPE "RouteTo" AS ENUM ('LIVE_AGENTS_ONLY', 'OFFLINE_ALLOWED');

-- CreateEnum
CREATE TYPE "FallbackBehavior" AS ENUM ('NONE', 'ASSIGN_ANY_AGENT', 'ASSIGN_ADMIN');

-- CreateEnum
CREATE TYPE "AutoReplyTrigger" AS ENUM ('FIRST_MESSAGE', 'DEPARTMENT_SELECTION', 'NO_AGENT_AVAILABLE', 'AFTER_HOURS');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "routingMetadata" JSONB;

-- CreateTable
CREATE TABLE "RoutingSettings" (
    "id" TEXT NOT NULL,
    "orgId" UUID NOT NULL,
    "autoRoutingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "routeTo" "RouteTo" NOT NULL DEFAULT 'LIVE_AGENTS_ONLY',
    "fallbackBehavior" "FallbackBehavior" NOT NULL DEFAULT 'ASSIGN_ADMIN',
    "afterHoursConfig" JSONB,
    "metadata" JSONB,

    CONSTRAINT "RoutingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoReply" (
    "id" TEXT NOT NULL,
    "orgId" UUID NOT NULL,
    "trigger" "AutoReplyTrigger" NOT NULL,
    "departmentId" TEXT,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "AutoReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoutingSettings_orgId_key" ON "RoutingSettings"("orgId");

-- AddForeignKey
ALTER TABLE "RoutingSettings" ADD CONSTRAINT "RoutingSettings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoReply" ADD CONSTRAINT "AutoReply_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoReply" ADD CONSTRAINT "AutoReply_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
