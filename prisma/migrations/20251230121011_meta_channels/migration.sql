/*
  Warnings:

  - A unique constraint covering the columns `[orgId,source,externalId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('FACEBOOK_MESSENGER', 'INSTAGRAM');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "source" "Channel";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_orgId_source_externalId_key" ON "Customer"("orgId", "source", "externalId");
