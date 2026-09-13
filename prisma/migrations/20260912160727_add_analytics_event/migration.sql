-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('SEARCH', 'PROPERTY_VIEW', 'COMPARE', 'ENQUIRY_START', 'ENQUIRY_SUBMIT', 'CLAIM_START', 'CLAIM_SUBMIT');

-- DropIndex
DROP INDEX "PropertyOwnerAccess_propertyId_idx";

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "propertyId" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_type_idx" ON "AnalyticsEvent"("type");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
