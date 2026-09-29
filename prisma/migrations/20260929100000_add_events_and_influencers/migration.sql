-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "coverImageAlt" TEXT,
    "venueName" TEXT,
    "address" TEXT,
    "localityId" TEXT,
    "propertyId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "ticketUrl" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "sponsored" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "submittedByName" TEXT,
    "submittedByEmail" TEXT,
    "submittedByPhone" TEXT,
    "rejectionReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerCriterion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,
    "category" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "websiteUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" "GuideStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerRating" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_startAt_idx" ON "Event"("status", "startAt");

-- CreateIndex
CREATE INDEX "Event_localityId_idx" ON "Event"("localityId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerCriterion_slug_key" ON "InfluencerCriterion"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_slug_key" ON "Influencer"("slug");

-- CreateIndex
CREATE INDEX "InfluencerRating_criterionId_idx" ON "InfluencerRating"("criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerRating_influencerId_criterionId_key" ON "InfluencerRating"("influencerId", "criterionId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerRating" ADD CONSTRAINT "InfluencerRating_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerRating" ADD CONSTRAINT "InfluencerRating_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "InfluencerCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

