-- AlterTable
ALTER TABLE "Influencer" ADD COLUMN     "claimed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "InfluencerClaimRequest" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "claimantName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "InfluencerClaimRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerOwnerAccess" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "claimRequestId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "InfluencerOwnerAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerOwnerSession" (
    "id" TEXT NOT NULL,
    "ownerAccessId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerOwnerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerEnquiry" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InfluencerClaimRequest_influencerId_idx" ON "InfluencerClaimRequest"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerClaimRequest_status_idx" ON "InfluencerClaimRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerOwnerAccess_influencerId_key" ON "InfluencerOwnerAccess"("influencerId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerOwnerAccess_claimRequestId_key" ON "InfluencerOwnerAccess"("claimRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerOwnerAccess_tokenHash_key" ON "InfluencerOwnerAccess"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerOwnerSession_tokenHash_key" ON "InfluencerOwnerSession"("tokenHash");

-- CreateIndex
CREATE INDEX "InfluencerOwnerSession_ownerAccessId_idx" ON "InfluencerOwnerSession"("ownerAccessId");

-- CreateIndex
CREATE INDEX "InfluencerEnquiry_influencerId_idx" ON "InfluencerEnquiry"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerEnquiry_status_idx" ON "InfluencerEnquiry"("status");

-- AddForeignKey
ALTER TABLE "InfluencerClaimRequest" ADD CONSTRAINT "InfluencerClaimRequest_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerClaimRequest" ADD CONSTRAINT "InfluencerClaimRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerOwnerAccess" ADD CONSTRAINT "InfluencerOwnerAccess_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerOwnerAccess" ADD CONSTRAINT "InfluencerOwnerAccess_claimRequestId_fkey" FOREIGN KEY ("claimRequestId") REFERENCES "InfluencerClaimRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerOwnerSession" ADD CONSTRAINT "InfluencerOwnerSession_ownerAccessId_fkey" FOREIGN KEY ("ownerAccessId") REFERENCES "InfluencerOwnerAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerEnquiry" ADD CONSTRAINT "InfluencerEnquiry_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

