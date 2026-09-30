-- AlterTable
ALTER TABLE "SponsoredPlacement" ADD COLUMN     "positions" INTEGER[] DEFAULT ARRAY[2, 12, 22]::INTEGER[];

