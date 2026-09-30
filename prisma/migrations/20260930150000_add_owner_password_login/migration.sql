-- AlterTable
ALTER TABLE "PropertyOwnerAccess" ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOwnerAccess_email_key" ON "PropertyOwnerAccess"("email");

