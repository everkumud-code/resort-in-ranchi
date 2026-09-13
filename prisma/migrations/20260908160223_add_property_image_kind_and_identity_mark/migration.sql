-- CreateEnum
CREATE TYPE "PropertyImageKind" AS ENUM ('PHOTO', 'ILLUSTRATIVE', 'LOGO');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "generatedIdentityMarkUrl" TEXT;

-- AlterTable
ALTER TABLE "PropertyImage" ADD COLUMN     "kind" "PropertyImageKind" NOT NULL DEFAULT 'PHOTO';
