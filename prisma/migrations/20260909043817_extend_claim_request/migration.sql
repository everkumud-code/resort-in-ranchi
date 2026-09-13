/*
  Warnings:

  - Added the required column `businessRole` to the `ClaimRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `ClaimRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ClaimRequest" ADD COLUMN     "businessRole" TEXT NOT NULL,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "reviewedById" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ClaimRequest" ADD CONSTRAINT "ClaimRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
