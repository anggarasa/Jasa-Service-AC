-- CreateEnum
CREATE TYPE "AcType" AS ENUM ('SPLIT', 'CASSETTE', 'FLOOR_STANDING', 'CENTRAL', 'WINDOW', 'PORTABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomerAuditAction" AS ENUM ('CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_ARCHIVED', 'ADDRESS_CREATED', 'ADDRESS_UPDATED', 'PRIMARY_ADDRESS_CHANGED', 'ADDRESS_ARCHIVED', 'AC_UNIT_CREATED', 'AC_UNIT_UPDATED', 'AC_UNIT_MOVED', 'AC_UNIT_ARCHIVED', 'AC_UNIT_PHOTO_ADDED', 'AC_UNIT_PHOTO_REMOVED');

-- AlterEnum
ALTER TYPE "MediaPurpose" ADD VALUE 'AC_UNIT_PHOTO';

-- DropIndex
DROP INDEX "AcUnit_customerId_idx";

-- DropIndex
DROP INDEX "Customer_businessId_phone_idx";

-- DropIndex
DROP INDEX "Customer_businessId_phone_key";

-- DropIndex
DROP INDEX "CustomerAddress_customerId_idx";

-- AlterTable
ALTER TABLE "AcUnit" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "customerAddressId" TEXT NOT NULL,
ADD COLUMN     "installationDate" TIMESTAMP(3),
ADD COLUMN     "installationRoom" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "unitCode" TEXT NOT NULL,
ADD COLUMN     "unitLabel" TEXT NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "AcType" NOT NULL DEFAULT 'SPLIT';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "customerCode" TEXT NOT NULL,
ADD COLUMN     "displayPhone" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "normalizedPhone" TEXT NOT NULL,
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "CustomerAddress" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "province" TEXT NOT NULL DEFAULT 'DKI Jakarta',
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientPhone" TEXT,
ADD COLUMN     "serviceAreaId" TEXT,
ADD COLUMN     "subdistrict" TEXT;

-- CreateTable
CREATE TABLE "AcUnitMedia" (
    "id" TEXT NOT NULL,
    "acUnitId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "caption" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcUnitMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAuditLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" "CustomerAuditAction" NOT NULL,
    "changedFields" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcUnitMedia_acUnitId_displayOrder_idx" ON "AcUnitMedia"("acUnitId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AcUnitMedia_acUnitId_mediaAssetId_key" ON "AcUnitMedia"("acUnitId", "mediaAssetId");

-- CreateIndex
CREATE INDEX "CustomerAuditLog_customerId_createdAt_idx" ON "CustomerAuditLog"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerAuditLog_businessId_action_idx" ON "CustomerAuditLog"("businessId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "AcUnit_unitCode_key" ON "AcUnit"("unitCode");

-- CreateIndex
CREATE INDEX "AcUnit_customerId_isActive_idx" ON "AcUnit"("customerId", "isActive");

-- CreateIndex
CREATE INDEX "AcUnit_customerAddressId_idx" ON "AcUnit"("customerAddressId");

-- CreateIndex
CREATE INDEX "Customer_businessId_normalizedPhone_idx" ON "Customer"("businessId", "normalizedPhone");

-- CreateIndex
CREATE INDEX "Customer_businessId_name_idx" ON "Customer"("businessId", "name");

-- CreateIndex
CREATE INDEX "Customer_businessId_isActive_idx" ON "Customer"("businessId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessId_customerCode_key" ON "Customer"("businessId", "customerCode");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_isActive_idx" ON "CustomerAddress"("customerId", "isActive");

-- CreateIndex
CREATE INDEX "CustomerAddress_serviceAreaId_idx" ON "CustomerAddress"("serviceAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAddress_id_customerId_key" ON "CustomerAddress"("id", "customerId");

-- Partial Unique Index to guarantee at most one active primary address per customer
CREATE UNIQUE INDEX "customer_address_one_active_primary_idx" ON "CustomerAddress" ("customerId") WHERE "isPrimary" = true AND "isActive" = true;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcUnit" ADD CONSTRAINT "AcUnit_customerAddressId_customerId_fkey" FOREIGN KEY ("customerAddressId", "customerId") REFERENCES "CustomerAddress"("id", "customerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcUnitMedia" ADD CONSTRAINT "AcUnitMedia_acUnitId_fkey" FOREIGN KEY ("acUnitId") REFERENCES "AcUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcUnitMedia" ADD CONSTRAINT "AcUnitMedia_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAuditLog" ADD CONSTRAINT "CustomerAuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAuditLog" ADD CONSTRAINT "CustomerAuditLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
