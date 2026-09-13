-- CreateEnum
CREATE TYPE "PropertySubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PartnerLeadDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED');

-- CreateTable
CREATE TABLE "PropertySubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "localityId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT,
    "contactName" TEXT NOT NULL,
    "contactRole" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "facilityIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "venueDetails" TEXT,
    "logoUrl" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PropertySubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "duplicateOfPropertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionNote" TEXT,
    "approvedPropertyId" TEXT,

    CONSTRAINT "PropertySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadPartner" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "eligibleCategorySlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLead" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "sourceEnquiryId" TEXT NOT NULL,
    "deliveryStatus" "PartnerLeadDeliveryStatus" NOT NULL DEFAULT 'DELIVERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertySubmission_approvedPropertyId_key" ON "PropertySubmission"("approvedPropertyId");

-- CreateIndex
CREATE INDEX "PropertySubmission_status_idx" ON "PropertySubmission"("status");

-- CreateIndex
CREATE INDEX "PropertySubmission_categoryId_idx" ON "PropertySubmission"("categoryId");

-- CreateIndex
CREATE INDEX "PropertySubmission_localityId_idx" ON "PropertySubmission"("localityId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadPartner_propertyId_key" ON "LeadPartner"("propertyId");

-- CreateIndex
CREATE INDEX "LeadPartner_enabled_idx" ON "LeadPartner"("enabled");

-- CreateIndex
CREATE INDEX "PartnerLead_partnerId_idx" ON "PartnerLead"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerLead_sourceEnquiryId_idx" ON "PartnerLead"("sourceEnquiryId");

-- AddForeignKey
ALTER TABLE "PropertySubmission" ADD CONSTRAINT "PropertySubmission_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertySubmission" ADD CONSTRAINT "PropertySubmission_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertySubmission" ADD CONSTRAINT "PropertySubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertySubmission" ADD CONSTRAINT "PropertySubmission_approvedPropertyId_fkey" FOREIGN KEY ("approvedPropertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadPartner" ADD CONSTRAINT "LeadPartner_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLead" ADD CONSTRAINT "PartnerLead_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "LeadPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLead" ADD CONSTRAINT "PartnerLead_sourceEnquiryId_fkey" FOREIGN KEY ("sourceEnquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
