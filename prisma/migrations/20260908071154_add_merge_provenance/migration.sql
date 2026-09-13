-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "mergedFromSourceRecordIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
