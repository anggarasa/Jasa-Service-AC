-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('NOT_INSPECTED', 'GOOD', 'NEEDS_SERVICE', 'REPAIR_REQUIRED', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('NOT_STARTED', 'DONE', 'NOT_APPLICABLE', 'NEEDS_ATTENTION');

-- CreateEnum
CREATE TYPE "WorkOrderPhotoCategory" AS ENUM ('BEFORE', 'DURING', 'AFTER', 'ISSUE');

-- AlterEnum
ALTER TYPE "MediaPurpose" ADD VALUE 'WORK_ORDER_PHOTO';

-- AlterEnum
ALTER TYPE "WorkOrderStatus" ADD VALUE 'ARRIVED';

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "arrivedAt" TIMESTAMP(3),
ADD COLUMN     "followUpNotes" TEXT,
ADD COLUMN     "followUpReason" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WorkOrderUnitInspection" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workOrderItemId" TEXT NOT NULL,
    "acUnitId" TEXT,
    "inspectionStatus" "InspectionStatus" NOT NULL DEFAULT 'NOT_INSPECTED',
    "reportedComplaint" TEXT,
    "observedCondition" TEXT,
    "diagnosis" TEXT,
    "recommendedAction" TEXT,
    "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderUnitInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceChecklistTemplate" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "serviceId" TEXT,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceChecklistTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderChecklistItem" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workOrderItemId" TEXT NOT NULL,
    "templateItemId" TEXT,
    "labelSnapshot" TEXT NOT NULL,
    "descriptionSnapshot" TEXT,
    "isRequiredSnapshot" BOOLEAN NOT NULL DEFAULT true,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "notes" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderPhoto" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workOrderItemId" TEXT,
    "mediaAssetId" TEXT NOT NULL,
    "category" "WorkOrderPhotoCategory" NOT NULL DEFAULT 'BEFORE',
    "caption" TEXT,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WorkOrderPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderServiceReport" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "workPerformed" TEXT NOT NULL,
    "issuesFound" TEXT,
    "recommendations" TEXT,
    "customerSignedName" TEXT,
    "technicianSignedName" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderServiceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderUnitInspection_workOrderItemId_key" ON "WorkOrderUnitInspection"("workOrderItemId");

-- CreateIndex
CREATE INDEX "WorkOrderUnitInspection_workOrderId_idx" ON "WorkOrderUnitInspection"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderUnitInspection_workOrderItemId_idx" ON "WorkOrderUnitInspection"("workOrderItemId");

-- CreateIndex
CREATE INDEX "ServiceChecklistTemplate_businessId_serviceId_idx" ON "ServiceChecklistTemplate"("businessId", "serviceId");

-- CreateIndex
CREATE INDEX "ServiceChecklistTemplateItem_templateId_displayOrder_idx" ON "ServiceChecklistTemplateItem"("templateId", "displayOrder");

-- CreateIndex
CREATE INDEX "WorkOrderChecklistItem_workOrderId_idx" ON "WorkOrderChecklistItem"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderChecklistItem_workOrderItemId_idx" ON "WorkOrderChecklistItem"("workOrderItemId");

-- CreateIndex
CREATE INDEX "WorkOrderPhoto_workOrderId_category_idx" ON "WorkOrderPhoto"("workOrderId", "category");

-- CreateIndex
CREATE INDEX "WorkOrderPhoto_workOrderItemId_idx" ON "WorkOrderPhoto"("workOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderServiceReport_workOrderId_key" ON "WorkOrderServiceReport"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderServiceReport_workOrderId_idx" ON "WorkOrderServiceReport"("workOrderId");

-- AddForeignKey
ALTER TABLE "WorkOrderUnitInspection" ADD CONSTRAINT "WorkOrderUnitInspection_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderUnitInspection" ADD CONSTRAINT "WorkOrderUnitInspection_workOrderItemId_fkey" FOREIGN KEY ("workOrderItemId") REFERENCES "WorkOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderUnitInspection" ADD CONSTRAINT "WorkOrderUnitInspection_acUnitId_fkey" FOREIGN KEY ("acUnitId") REFERENCES "AcUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceChecklistTemplate" ADD CONSTRAINT "ServiceChecklistTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceChecklistTemplate" ADD CONSTRAINT "ServiceChecklistTemplate_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceChecklistTemplateItem" ADD CONSTRAINT "ServiceChecklistTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ServiceChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderChecklistItem" ADD CONSTRAINT "WorkOrderChecklistItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderChecklistItem" ADD CONSTRAINT "WorkOrderChecklistItem_workOrderItemId_fkey" FOREIGN KEY ("workOrderItemId") REFERENCES "WorkOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPhoto" ADD CONSTRAINT "WorkOrderPhoto_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPhoto" ADD CONSTRAINT "WorkOrderPhoto_workOrderItemId_fkey" FOREIGN KEY ("workOrderItemId") REFERENCES "WorkOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderPhoto" ADD CONSTRAINT "WorkOrderPhoto_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderServiceReport" ADD CONSTRAINT "WorkOrderServiceReport_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

