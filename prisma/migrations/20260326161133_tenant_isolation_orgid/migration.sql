/*
  Warnings:

  - Added the required column `orgId` to the `ConversationTag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgId` to the `CustomerTag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConversationTag" ADD COLUMN     "orgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CustomerTag" ADD COLUMN     "orgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "orgId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ConversationTag_orgId_idx" ON "ConversationTag"("orgId");

-- CreateIndex
CREATE INDEX "CustomerTag_orgId_idx" ON "CustomerTag"("orgId");

-- CreateIndex
CREATE INDEX "Message_orgId_idx" ON "Message"("orgId");

-- CreateIndex
CREATE INDEX "Message_conversationId_orgId_idx" ON "Message"("conversationId", "orgId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationTag" ADD CONSTRAINT "ConversationTag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerTag" ADD CONSTRAINT "CustomerTag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
