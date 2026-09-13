-- AlterTable
ALTER TABLE "LeadPartner" ADD COLUMN     "eligibleLocationSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "monthlyLeadCap" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PartnerLead" ADD COLUMN     "eligibilityReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastDeliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

