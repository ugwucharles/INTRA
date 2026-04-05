-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "pageId" TEXT;
