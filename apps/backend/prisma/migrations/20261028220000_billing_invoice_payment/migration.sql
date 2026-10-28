-- AlterEnum
ALTER TYPE "MediaPurpose" ADD VALUE 'PAYMENT_PROOF';
ALTER TYPE "MediaPurpose" ADD VALUE 'APPROVAL_EVIDENCE';

-- CreateTable
CREATE TABLE "WorkOrderCharge" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workOrderItemId" TEXT,
    "lineType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "lineAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "proposedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderMaterial" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workOrderItemId" TEXT,
    "materialName" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceChargeApproval" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "pricingVersion" INTEGER NOT NULL DEFAULT 1,
    "proposedTotal" DECIMAL(12,2) NOT NULL,
    "approvedTotal" DECIMAL(12,2),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvalMethod" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "approvalEvidenceMediaId" TEXT,
    "approvedByName" TEXT,
    "approvedByContact" TEXT,
    "approvedAt" TIMESTAMP(3),
    "recordedByUserId" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceChargeApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "verifiedPaidTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdByUserId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "lineType" TEXT NOT NULL,
    "descriptionSnapshot" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "paidAtClaimed" TIMESTAMP(3),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "idempotencyKeyHash" TEXT,
    "proofMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAuditLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderCharge_workOrderId_idx" ON "WorkOrderCharge"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderMaterial_workOrderId_idx" ON "WorkOrderMaterial"("workOrderId");

-- CreateIndex
CREATE INDEX "ServiceChargeApproval_workOrderId_idx" ON "ServiceChargeApproval"("workOrderId");

-- CreateIndex
CREATE INDEX "ServiceChargeApproval_workOrderId_status_idx" ON "ServiceChargeApproval"("workOrderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_workOrderId_key" ON "Invoice"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_businessId_status_idx" ON "Invoice"("businessId", "status");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentReference_key" ON "Payment"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKeyHash_key" ON "Payment"("idempotencyKeyHash");

-- CreateIndex
CREATE INDEX "Payment_businessId_status_idx" ON "Payment"("businessId", "status");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_recordedAt_idx" ON "Payment"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_paymentId_key" ON "PaymentReceipt"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_receiptNumber_key" ON "PaymentReceipt"("receiptNumber");

-- CreateIndex
CREATE INDEX "FinancialAuditLog_businessId_aggregateType_aggregateId_idx" ON "FinancialAuditLog"("businessId", "aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "FinancialAuditLog_createdAt_idx" ON "FinancialAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkOrderCharge" ADD CONSTRAINT "WorkOrderCharge_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderCharge" ADD CONSTRAINT "WorkOrderCharge_workOrderItemId_fkey" FOREIGN KEY ("workOrderItemId") REFERENCES "WorkOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderMaterial" ADD CONSTRAINT "WorkOrderMaterial_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderMaterial" ADD CONSTRAINT "WorkOrderMaterial_workOrderItemId_fkey" FOREIGN KEY ("workOrderItemId") REFERENCES "WorkOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceChargeApproval" ADD CONSTRAINT "ServiceChargeApproval_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceChargeApproval" ADD CONSTRAINT "ServiceChargeApproval_approvalEvidenceMediaId_fkey" FOREIGN KEY ("approvalEvidenceMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_proofMediaId_fkey" FOREIGN KEY ("proofMediaId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
