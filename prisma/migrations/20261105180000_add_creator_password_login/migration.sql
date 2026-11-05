-- AlterTable
ALTER TABLE "InfluencerOwnerAccess" ADD COLUMN     "email" TEXT,
ADD COLUMN     "passwordHash" TEXT;

-- CreateTable
CREATE TABLE "CreatorPasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ownerAccessId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPasswordResetToken_tokenHash_key" ON "CreatorPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "CreatorPasswordResetToken_ownerAccessId_createdAt_idx" ON "CreatorPasswordResetToken"("ownerAccessId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerOwnerAccess_email_key" ON "InfluencerOwnerAccess"("email");

-- AddForeignKey
ALTER TABLE "CreatorPasswordResetToken" ADD CONSTRAINT "CreatorPasswordResetToken_ownerAccessId_fkey" FOREIGN KEY ("ownerAccessId") REFERENCES "InfluencerOwnerAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
