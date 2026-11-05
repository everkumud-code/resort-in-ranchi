-- CreateTable
CREATE TABLE "PromoAd" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "points" TEXT[],
    "ctaLabel" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "accent" TEXT NOT NULL DEFAULT 'teal',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoPlacement" (
    "slot" TEXT NOT NULL,
    "adId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoPlacement_pkey" PRIMARY KEY ("slot")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoAd_key_key" ON "PromoAd"("key");

-- AddForeignKey
ALTER TABLE "PromoPlacement" ADD CONSTRAINT "PromoPlacement_adId_fkey" FOREIGN KEY ("adId") REFERENCES "PromoAd"("id") ON DELETE SET NULL ON UPDATE CASCADE;
