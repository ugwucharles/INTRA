/*
  Warnings:

  - A unique constraint covering the columns `[orgId,channel,pageId]` on the table `SocialAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CONVERSATION_UNASSIGNED';

-- DropIndex
DROP INDEX "SocialAccount_orgId_channel_key";

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "avatarUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_orgId_channel_pageId_key" ON "SocialAccount"("orgId", "channel", "pageId");
