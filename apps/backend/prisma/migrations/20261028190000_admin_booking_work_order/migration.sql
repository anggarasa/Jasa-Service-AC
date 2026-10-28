-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkOrderStatus" ADD VALUE 'DRAFT';
ALTER TYPE "WorkOrderStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "WorkOrderStatus" ADD VALUE 'ON_THE_WAY';
ALTER TYPE "WorkOrderStatus" ADD VALUE 'FOLLOW_UP_REQUIRED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "rescheduleCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "adminInstructions" TEXT,
ADD COLUMN     "businessId" TEXT NOT NULL,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "customerAddressId" TEXT NOT NULL,
ADD COLUMN     "customerComplaintSnapshot" TEXT,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "scheduledEndAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "scheduledStartAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "serviceSummarySnapshot" TEXT,
ADD COLUMN     "workOrderNumber" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "WorkOrderItem" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "acUnitId" TEXT,
    "serviceId" TEXT NOT NULL,
    "serviceNameSnapshot" TEXT NOT NULL,
    "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "itemTotal" DECIMAL(12,2) NOT NULL,
    "actionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderStatusHistory" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "fromStatus" "WorkOrderStatus",
    "toStatus" "WorkOrderStatus" NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderAssignmentHistory" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "fromTechnicianId" TEXT,
    "toTechnicianId" TEXT,
    "reason" TEXT,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAuditLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus",
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderItem_workOrderId_idx" ON "WorkOrderItem"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderItem_acUnitId_idx" ON "WorkOrderItem"("acUnitId");

-- CreateIndex
CREATE INDEX "WorkOrderStatusHistory_workOrderId_createdAt_idx" ON "WorkOrderStatusHistory"("workOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkOrderAssignmentHistory_workOrderId_createdAt_idx" ON "WorkOrderAssignmentHistory"("workOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingAuditLog_bookingId_createdAt_idx" ON "BookingAuditLog"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber");

-- CreateIndex
CREATE INDEX "WorkOrder_businessId_status_idx" ON "WorkOrder"("businessId", "status");

-- CreateIndex
CREATE INDEX "WorkOrder_customerId_idx" ON "WorkOrder"("customerId");

-- CreateIndex
CREATE INDEX "WorkOrder_scheduledStartAt_idx" ON "WorkOrder"("scheduledStartAt");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_customerAddressId_fkey" FOREIGN KEY ("customerAddressId") REFERENCES "CustomerAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderItem" ADD CONSTRAINT "WorkOrderItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderItem" ADD CONSTRAINT "WorkOrderItem_acUnitId_fkey" FOREIGN KEY ("acUnitId") REFERENCES "AcUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderStatusHistory" ADD CONSTRAINT "WorkOrderStatusHistory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAssignmentHistory" ADD CONSTRAINT "WorkOrderAssignmentHistory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAuditLog" ADD CONSTRAINT "BookingAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

