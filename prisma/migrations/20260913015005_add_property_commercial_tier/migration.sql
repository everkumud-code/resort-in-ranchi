-- CreateEnum
CREATE TYPE "CommercialTier" AS ENUM ('FREE', 'PREMIUM', 'LEAD_PARTNER');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "commercialTier" "CommercialTier" NOT NULL DEFAULT 'FREE';

