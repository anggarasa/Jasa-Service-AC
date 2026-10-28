-- Enable btree_gist extension for PostgreSQL exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingSource" TEXT NOT NULL DEFAULT 'WEBSITE',
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "estimatedDurationMinutes" INTEGER,
ADD COLUMN     "estimatedServicePrice" DECIMAL(12,2),
ADD COLUMN     "estimatedTotal" DECIMAL(12,2),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "occupancyEndAt" TIMESTAMP(3),
ADD COLUMN     "occupancyStartAt" TIMESTAMP(3),
ADD COLUMN     "priceTypeSnapshot" "PriceType",
ADD COLUMN     "serviceAreaId" TEXT,
ADD COLUMN     "serviceNameSnapshot" TEXT,
ADD COLUMN     "unitCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "visitFeeSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
ALTER COLUMN "estimatedPrice" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "BusinessSetting" ADD COLUMN     "pendingHoldMinutes" INTEGER NOT NULL DEFAULT 120;

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "acUnitId" TEXT,
    "brandSnapshot" TEXT,
    "modelSnapshot" TEXT,
    "typeSnapshot" "AcType" NOT NULL DEFAULT 'SPLIT',
    "capacityPkSnapshot" DECIMAL(4,2),
    "installationRoomSnapshot" TEXT,
    "serviceId" TEXT NOT NULL,
    "unitPriceSnapshot" DECIMAL(12,2),
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingStatusHistory" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAccessToken" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingIdempotency" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "bookingId" TEXT,
    "responsePayload" JSONB,
    "state" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingIdempotency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceOccupancy" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "bookingId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceOccupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicianBlock" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "technicianId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicianBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_idx" ON "BookingItem"("bookingId");

-- CreateIndex
CREATE INDEX "BookingItem_acUnitId_idx" ON "BookingItem"("acUnitId");

-- CreateIndex
CREATE INDEX "BookingStatusHistory_bookingId_createdAt_idx" ON "BookingStatusHistory"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAccessToken_tokenHash_key" ON "BookingAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "BookingAccessToken_tokenHash_expiresAt_idx" ON "BookingAccessToken"("tokenHash", "expiresAt");

-- CreateIndex
CREATE INDEX "BookingAccessToken_bookingId_idx" ON "BookingAccessToken"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingIdempotency_keyHash_key" ON "BookingIdempotency"("keyHash");

-- CreateIndex
CREATE INDEX "BookingIdempotency_keyHash_idx" ON "BookingIdempotency"("keyHash");

-- CreateIndex
CREATE INDEX "BookingIdempotency_expiresAt_idx" ON "BookingIdempotency"("expiresAt");

-- CreateIndex
CREATE INDEX "ResourceOccupancy_technicianId_status_startsAt_endsAt_idx" ON "ResourceOccupancy"("technicianId", "status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "ResourceOccupancy_bookingId_idx" ON "ResourceOccupancy"("bookingId");

-- CreateIndex
CREATE INDEX "TechnicianBlock_technicianId_isActive_startsAt_endsAt_idx" ON "TechnicianBlock"("technicianId", "isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Booking_expiresAt_idx" ON "Booking"("expiresAt");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_acUnitId_fkey" FOREIGN KEY ("acUnitId") REFERENCES "AcUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingStatusHistory" ADD CONSTRAINT "BookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAccessToken" ADD CONSTRAINT "BookingAccessToken_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingIdempotency" ADD CONSTRAINT "BookingIdempotency_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceOccupancy" ADD CONSTRAINT "ResourceOccupancy_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceOccupancy" ADD CONSTRAINT "ResourceOccupancy_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicianBlock" ADD CONSTRAINT "TechnicianBlock_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PostgreSQL Exclusion Constraint for Database-Level Double-Booking Prevention
ALTER TABLE "ResourceOccupancy"
ADD CONSTRAINT "no_overlapping_technician_occupancy"
EXCLUDE USING gist (
    "technicianId" WITH =,
    tsrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" = 'ACTIVE');
