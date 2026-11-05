-- CreateTable
CREATE TABLE "OwnerPasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ownerAccessId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerPasswordResetToken_tokenHash_key" ON "OwnerPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "OwnerPasswordResetToken_ownerAccessId_createdAt_idx" ON "OwnerPasswordResetToken"("ownerAccessId", "createdAt");

-- AddForeignKey
ALTER TABLE "OwnerPasswordResetToken" ADD CONSTRAINT "OwnerPasswordResetToken_ownerAccessId_fkey" FOREIGN KEY ("ownerAccessId") REFERENCES "PropertyOwnerAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
