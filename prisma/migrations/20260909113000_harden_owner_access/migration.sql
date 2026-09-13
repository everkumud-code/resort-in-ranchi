-- Initial owner-access links are single-use. A property can have only one
-- owner-access relationship, and browser sessions are stored separately.
ALTER TABLE "PropertyOwnerAccess" ADD COLUMN "consumedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "PropertyOwnerAccess_propertyId_key" ON "PropertyOwnerAccess"("propertyId");

CREATE TABLE "PropertyOwnerSession" (
    "id" TEXT NOT NULL,
    "ownerAccessId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyOwnerSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PropertyOwnerSession_tokenHash_key" ON "PropertyOwnerSession"("tokenHash");
CREATE INDEX "PropertyOwnerSession_ownerAccessId_idx" ON "PropertyOwnerSession"("ownerAccessId");

ALTER TABLE "PropertyOwnerSession" ADD CONSTRAINT "PropertyOwnerSession_ownerAccessId_fkey"
  FOREIGN KEY ("ownerAccessId") REFERENCES "PropertyOwnerAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
