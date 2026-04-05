-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CONVERSATION_RESOLVED';

-- AlterEnum
ALTER TYPE "Channel" ADD VALUE 'EMAIL';

-- AlterEnum
ALTER TYPE "ConversationStatus" ADD VALUE 'RESOLVED';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "awaitingRating" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customerRating" INTEGER,
ADD COLUMN     "resolvedBy" UUID;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ratingTotal" DOUBLE PRECISION NOT NULL DEFAULT 0;
