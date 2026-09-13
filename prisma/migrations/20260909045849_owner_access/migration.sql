-- CreateTable
CREATE TABLE "PropertyOwnerAccess" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "claimRequestId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PropertyOwnerAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOwnerAccess_claimRequestId_key" ON "PropertyOwnerAccess"("claimRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOwnerAccess_tokenHash_key" ON "PropertyOwnerAccess"("tokenHash");

-- CreateIndex
CREATE INDEX "PropertyOwnerAccess_propertyId_idx" ON "PropertyOwnerAccess"("propertyId");

-- AddForeignKey
ALTER TABLE "PropertyOwnerAccess" ADD CONSTRAINT "PropertyOwnerAccess_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyOwnerAccess" ADD CONSTRAINT "PropertyOwnerAccess_claimRequestId_fkey" FOREIGN KEY ("claimRequestId") REFERENCES "ClaimRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
