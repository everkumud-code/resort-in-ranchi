-- CreateEnum
CREATE TYPE "InfluencerSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "InfluencerSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "bio" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "websiteUrl" TEXT,
    "photoUrl" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "status" "InfluencerSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "duplicateOfInfluencerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "rejectionNote" TEXT,
    "approvedInfluencerId" TEXT,

    CONSTRAINT "InfluencerSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerSubmission_approvedInfluencerId_key" ON "InfluencerSubmission"("approvedInfluencerId");

-- CreateIndex
CREATE INDEX "InfluencerSubmission_status_idx" ON "InfluencerSubmission"("status");

-- AddForeignKey
ALTER TABLE "InfluencerSubmission" ADD CONSTRAINT "InfluencerSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerSubmission" ADD CONSTRAINT "InfluencerSubmission_approvedInfluencerId_fkey" FOREIGN KEY ("approvedInfluencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

