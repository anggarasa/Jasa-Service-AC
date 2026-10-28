-- CreateEnum
CREATE TYPE "PricingUnit" AS ENUM ('PER_UNIT', 'PER_VISIT', 'INSPECTION');

-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('BUSINESS_LOGO', 'SERVICE_IMAGE', 'GALLERY_IMAGE');

-- DropIndex
DROP INDEX "Service_businessId_isActive_idx";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Jakarta Selatan',
ADD COLUMN     "googleMapsUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "postalCode" TEXT DEFAULT '12160',
ADD COLUMN     "province" TEXT NOT NULL DEFAULT 'DKI Jakarta';

-- AlterTable
ALTER TABLE "BusinessSetting" DROP COLUMN "defaultBufferMinutes",
ADD COLUMN     "allowCustomerCancellation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoConfirmBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancellationWindowHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "defaultServiceBufferMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "defaultTravelBufferMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "maximumUnitsPerBooking" INTEGER NOT NULL DEFAULT 5,
ALTER COLUMN "bookingIntervalMinutes" SET DEFAULT 30;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "additionalBufferMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maximumUnits" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "minimumUnits" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pricingUnit" "PricingUnit" NOT NULL DEFAULT 'PER_UNIT',
ADD COLUMN     "shortDescription" TEXT,
ALTER COLUMN "basePrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ServiceArea" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "estimatedTravelMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "province" TEXT NOT NULL DEFAULT 'DKI Jakarta';

-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessOperatingHour" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '17:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessOperatingHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessOperatingBreak" (
    "id" TEXT NOT NULL,
    "operatingHourId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '12:00',
    "endTime" TEXT NOT NULL DEFAULT '13:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessOperatingBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessClosure" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'tampilkit-ac-booking',
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "purpose" "MediaPurpose" NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessGallery" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "caption" TEXT,
    "altText" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessGallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_isRevoked_idx" ON "Session"("userId", "isRevoked");

-- CreateIndex
CREATE INDEX "BusinessOperatingHour_businessId_dayOfWeek_idx" ON "BusinessOperatingHour"("businessId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessOperatingHour_businessId_dayOfWeek_key" ON "BusinessOperatingHour"("businessId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "BusinessOperatingBreak_operatingHourId_idx" ON "BusinessOperatingBreak"("operatingHourId");

-- CreateIndex
CREATE INDEX "BusinessClosure_businessId_startDate_endDate_idx" ON "BusinessClosure"("businessId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_objectKey_key" ON "MediaAsset"("objectKey");

-- CreateIndex
CREATE INDEX "MediaAsset_businessId_purpose_idx" ON "MediaAsset"("businessId", "purpose");

-- CreateIndex
CREATE INDEX "BusinessGallery_businessId_isActive_displayOrder_idx" ON "BusinessGallery"("businessId", "isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "Service_businessId_isActive_displayOrder_idx" ON "Service"("businessId", "isActive", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_businessId_name_key" ON "ServiceArea"("businessId", "name");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessOperatingHour" ADD CONSTRAINT "BusinessOperatingHour_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessOperatingBreak" ADD CONSTRAINT "BusinessOperatingBreak_operatingHourId_fkey" FOREIGN KEY ("operatingHourId") REFERENCES "BusinessOperatingHour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessClosure" ADD CONSTRAINT "BusinessClosure_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessGallery" ADD CONSTRAINT "BusinessGallery_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessGallery" ADD CONSTRAINT "BusinessGallery_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
