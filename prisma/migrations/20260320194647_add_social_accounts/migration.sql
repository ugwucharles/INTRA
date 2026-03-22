-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "orgId" UUID NOT NULL,
    "channel" "Channel" NOT NULL,
    "displayName" TEXT,
    "pageId" TEXT,
    "accessToken" TEXT NOT NULL,
    "appSecret" TEXT,
    "phoneNumberId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialAccount_pageId_idx" ON "SocialAccount"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_orgId_channel_key" ON "SocialAccount"("orgId", "channel");

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
