/*
  Warnings:

  - The primary key for the `Organization` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_DepartmentToUser` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_orgId_fkey";

-- DropForeignKey
ALTER TABLE "AutoReply" DROP CONSTRAINT "AutoReply_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_assignedTo_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_orgId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationNote" DROP CONSTRAINT "ConversationNote_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationNote" DROP CONSTRAINT "ConversationNote_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_orgId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerNote" DROP CONSTRAINT "CustomerNote_orgId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerNote" DROP CONSTRAINT "CustomerNote_userId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_orgId_fkey";

-- DropForeignKey
ALTER TABLE "RoutingSettings" DROP CONSTRAINT "RoutingSettings_orgId_fkey";

-- DropForeignKey
ALTER TABLE "SavedReply" DROP CONSTRAINT "SavedReply_orgId_fkey";

-- DropForeignKey
ALTER TABLE "SocialAccount" DROP CONSTRAINT "SocialAccount_orgId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_orgId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_orgId_fkey";

-- DropForeignKey
ALTER TABLE "_DepartmentToUser" DROP CONSTRAINT "_DepartmentToUser_B_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "AutoReply" ALTER COLUMN "orgId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "firstResponseTime" INTEGER,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ALTER COLUMN "assignedTo" SET DATA TYPE TEXT,
ALTER COLUMN "resolvedBy" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ConversationNote" ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ALTER COLUMN "authorId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "orgId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "CustomerNote" ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "orgId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_pkey",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Organization_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RoutingSettings" ALTER COLUMN "orgId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SavedReply" ALTER COLUMN "orgId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "SocialAccount" ALTER COLUMN "orgId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "orgId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "orgId" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "_DepartmentToUser" DROP CONSTRAINT "_DepartmentToUser_AB_pkey",
ALTER COLUMN "B" SET DATA TYPE TEXT,
ADD CONSTRAINT "_DepartmentToUser_AB_pkey" PRIMARY KEY ("A", "B");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingSettings" ADD CONSTRAINT "RoutingSettings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoReply" ADD CONSTRAINT "AutoReply_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationNote" ADD CONSTRAINT "ConversationNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationNote" ADD CONSTRAINT "ConversationNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReply" ADD CONSTRAINT "SavedReply_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentToUser" ADD CONSTRAINT "_DepartmentToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
