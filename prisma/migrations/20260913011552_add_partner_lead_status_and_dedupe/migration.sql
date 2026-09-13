-- CreateEnum
CREATE TYPE "PartnerLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED_LOST');

-- AlterTable
ALTER TABLE "PartnerLead" ADD COLUMN     "status" "PartnerLeadStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "statusUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerLead_partnerId_sourceEnquiryId_key" ON "PartnerLead"("partnerId", "sourceEnquiryId");

