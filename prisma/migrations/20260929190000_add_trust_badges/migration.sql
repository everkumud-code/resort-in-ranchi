-- CreateTable
CREATE TABLE "TrustBadge" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyBadge" (
    "propertyId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyBadge_pkey" PRIMARY KEY ("propertyId","badgeId")
);

-- CreateTable
CREATE TABLE "InfluencerBadge" (
    "influencerId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerBadge_pkey" PRIMARY KEY ("influencerId","badgeId")
);

-- CreateTable
CREATE TABLE "EventBadge" (
    "eventId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventBadge_pkey" PRIMARY KEY ("eventId","badgeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustBadge_key_key" ON "TrustBadge"("key");

-- CreateIndex
CREATE INDEX "PropertyBadge_badgeId_idx" ON "PropertyBadge"("badgeId");

-- CreateIndex
CREATE INDEX "InfluencerBadge_badgeId_idx" ON "InfluencerBadge"("badgeId");

-- CreateIndex
CREATE INDEX "EventBadge_badgeId_idx" ON "EventBadge"("badgeId");

-- AddForeignKey
ALTER TABLE "PropertyBadge" ADD CONSTRAINT "PropertyBadge_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyBadge" ADD CONSTRAINT "PropertyBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "TrustBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerBadge" ADD CONSTRAINT "InfluencerBadge_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerBadge" ADD CONSTRAINT "InfluencerBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "TrustBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBadge" ADD CONSTRAINT "EventBadge_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBadge" ADD CONSTRAINT "EventBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "TrustBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

