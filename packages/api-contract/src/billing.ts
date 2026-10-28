import { z } from 'zod';

export const ChargeLineTypeEnum = z.enum([
  'SERVICE',
  'VISIT_FEE',
  'ADDITIONAL_LABOR',
  'ADDITIONAL_SERVICE',
  'MATERIAL',
  'DISCOUNT',
  'TAX',
]);
export type ChargeLineType = z.infer<typeof ChargeLineTypeEnum>;

export const ChargeStatusEnum = z.enum([
  'DRAFT',
  'PROPOSED',
  'APPROVED',
  'REJECTED',
]);
export type ChargeStatus = z.infer<typeof ChargeStatusEnum>;

export const ApprovalStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SUPERSEDED',
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusEnum>;

export const ApprovalMethodEnum = z.enum([
  'IN_PERSON',
  'MEDIA_UPLOAD',
  'CUSTOMER_CONFIRMATION',
  'PHONE_VERBAL',
]);
export type ApprovalMethod = z.infer<typeof ApprovalMethodEnum>;

export const InvoiceStatusEnum = z.enum([
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'VOID',
]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const PaymentMethodEnum = z.enum([
  'CASH',
  'BANK_TRANSFER',
  'EXTERNAL_QRIS',
  'OTHER_MANUAL',
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const PaymentStatusEnum = z.enum([
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'VOID',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

// Work Order Charge
export const WorkOrderChargeSchema = z.object({
  id: z.string().uuid().optional(),
  workOrderId: z.string().uuid(),
  workOrderItemId: z.string().uuid().nullable().optional(),
  lineType: ChargeLineTypeEnum,
  description: z.string().min(2, 'Deskripsi wajib diisi'),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus positif'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Harga satuan harus berupa angka desimal valid'),
  lineAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Jumlah baris harus berupa angka desimal valid'),
  currency: z.string().default('IDR'),
  status: ChargeStatusEnum.default('DRAFT'),
  proposedByUserId: z.string().nullable().optional(),
  approvedByUserId: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type WorkOrderChargeDto = z.infer<typeof WorkOrderChargeSchema>;

// Work Order Material
export const WorkOrderMaterialSchema = z.object({
  id: z.string().uuid().optional(),
  workOrderId: z.string().uuid(),
  workOrderItemId: z.string().uuid().nullable().optional(),
  materialName: z.string().min(2, 'Nama material/komponen wajib diisi'),
  quantity: z.coerce.number().min(0.01, 'Kuantitas harus positif'),
  unit: z.string().min(1, 'Satuan wajib diisi (e.g. unit, pcs, m, psi, kg)'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Harga satuan harus berupa desimal valid'),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Total biaya harus berupa desimal valid'),
  notes: z.string().nullable().optional(),
  recordedByUserId: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type WorkOrderMaterialDto = z.infer<typeof WorkOrderMaterialSchema>;

// Service Charge Approval
export const ServiceChargeApprovalSchema = z.object({
  id: z.string().uuid().optional(),
  workOrderId: z.string().uuid(),
  pricingVersion: z.coerce.number().int().min(1).default(1),
  proposedTotal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Total ajuan desimal valid'),
  approvedTotal: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable().optional(),
  status: ApprovalStatusEnum.default('DRAFT'),
  approvalMethod: ApprovalMethodEnum.default('IN_PERSON'),
  approvalEvidenceMediaId: z.string().uuid().nullable().optional(),
  approvedByName: z.string().nullable().optional(),
  approvedByContact: z.string().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  recordedByUserId: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type ServiceChargeApprovalDto = z.infer<typeof ServiceChargeApprovalSchema>;

// Pricing Summary DTO
export interface WorkOrderPricingSummaryDto {
  workOrderId: string;
  workOrderNumber: string;
  bookingCode: string;
  customerName: string;
  pricingVersion: number;
  originalEstimate: {
    serviceName: string;
    unitCount: number;
    estimatedServicePrice: string;
    visitFeeSnapshot: string;
    estimatedTotal: string;
  };
  actualPricing: {
    subtotalServices: string;
    visitFee: string;
    additionalLaborTotal: string;
    additionalServicesTotal: string;
    materialsTotal: string;
    discountTotal: string;
    taxTotal: string;
    calculatedGrandTotal: string;
  };
  approval: ServiceChargeApprovalDto | null;
  charges: WorkOrderChargeDto[];
  materials: WorkOrderMaterialDto[];
  eligibleForInvoice: boolean;
  eligibilityNotes?: string;
  hasExistingInvoice: boolean;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceStatus?: InvoiceStatus | null;
}

// Request to Save Work Order Pricing
export const SaveWorkOrderPricingSchema = z.object({
  charges: z.array(
    z.object({
      id: z.string().uuid().optional(),
      workOrderItemId: z.string().uuid().nullable().optional(),
      lineType: ChargeLineTypeEnum,
      description: z.string().min(2, 'Deskripsi wajib diisi'),
      quantity: z.coerce.number().min(0.01),
      unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
    }),
  ),
  materials: z.array(
    z.object({
      id: z.string().uuid().optional(),
      workOrderItemId: z.string().uuid().nullable().optional(),
      materialName: z.string().min(2),
      quantity: z.coerce.number().min(0.01),
      unit: z.string().min(1),
      unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
      notes: z.string().optional(),
    }),
  ).optional().default([]),
  discountAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().default('0'),
  taxPercent: z.coerce.number().min(0).max(100).optional().default(0),
});
export type SaveWorkOrderPricingRequest = z.infer<typeof SaveWorkOrderPricingSchema>;

// Request to Create/Submit Approval
export const CreateChargeApprovalSchema = z.object({
  approvalMethod: ApprovalMethodEnum,
  approvedByName: z.string().min(2, 'Nama penyetuju wajib diisi').optional(),
  approvedByContact: z.string().optional(),
  approvalEvidenceMediaId: z.string().uuid().optional(),
  internalNotes: z.string().max(1000).optional(),
});
export type CreateChargeApprovalRequest = z.infer<typeof CreateChargeApprovalSchema>;

// Invoice Item DTO
export const InvoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  invoiceId: z.string().uuid(),
  lineType: ChargeLineTypeEnum,
  descriptionSnapshot: z.string().min(2),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  lineTotal: z.string().regex(/^\d+(\.\d{1,2})?$/),
  createdAt: z.string().optional(),
});
export type InvoiceItemDto = z.infer<typeof InvoiceItemSchema>;

// Invoice DTO
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  bookingId: z.string().uuid(),
  workOrderId: z.string().uuid(),
  invoiceNumber: z.string(),
  customerId: z.string().uuid(),
  status: InvoiceStatusEnum,
  currency: z.string().default('IDR'),
  subtotal: z.string(),
  discountTotal: z.string(),
  taxTotal: z.string(),
  grandTotal: z.string(),
  verifiedPaidTotal: z.string(),
  outstandingBalance: z.string(),
  issuedAt: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  createdByUserId: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.coerce.number().int().default(1),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
      phone: z.string(),
      email: z.string().nullable().optional(),
    })
    .optional(),
  workOrder: z
    .object({
      id: z.string(),
      workOrderNumber: z.string(),
      status: z.string(),
      completedAt: z.string().nullable().optional(),
    })
    .optional(),
  booking: z
    .object({
      id: z.string(),
      bookingCode: z.string(),
      serviceNameSnapshot: z.string().nullable().optional(),
    })
    .optional(),
  items: z.array(InvoiceItemSchema).optional(),
  payments: z.array(z.any()).optional(),
});
export type InvoiceDto = z.infer<typeof InvoiceSchema>;

// Invoice Query
export const InvoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: InvoiceStatusEnum.optional(),
  customerId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type InvoiceListQuery = z.input<typeof InvoiceListQuerySchema>;

export interface InvoiceListResponse {
  items: InvoiceDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Payment DTO
export const PaymentSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  paymentReference: z.string(),
  method: PaymentMethodEnum,
  amount: z.string(),
  currency: z.string().default('IDR'),
  status: PaymentStatusEnum,
  paidAtClaimed: z.string().nullable().optional(),
  recordedAt: z.string(),
  recordedByUserId: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
  verifiedByUserId: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  proofMediaId: z.string().uuid().nullable().optional(),
  receipt: z
    .object({
      id: z.string(),
      receiptNumber: z.string(),
      issuedAt: z.string(),
    })
    .nullable()
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PaymentDto = z.infer<typeof PaymentSchema>;

// Record Payment Request
export const RecordPaymentSchema = z.object({
  method: PaymentMethodEnum,
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Jumlah pembayaran harus angka valid'),
  paidAtClaimed: z.string().optional(),
  notes: z.string().max(500).optional(),
  proofMediaId: z.string().uuid().optional(),
  idempotencyKey: z.string().min(8, 'Idempotency key wajib disertakan minimal 8 karakter'),
});
export type RecordPaymentRequest = z.infer<typeof RecordPaymentSchema>;

// Verify/Reject Payment Request
export const VerifyPaymentSchema = z.object({
  notes: z.string().max(500).optional(),
});
export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentSchema>;

export const RejectPaymentSchema = z.object({
  rejectionReason: z.string().min(3, 'Alasan penolakan wajib diisi'),
});
export type RejectPaymentRequest = z.infer<typeof RejectPaymentSchema>;

// Void Invoice Request
export const VoidInvoiceSchema = z.object({
  voidReason: z.string().min(5, 'Alasan pembatalan faktur wajib diisi minimal 5 karakter'),
});
export type VoidInvoiceRequest = z.infer<typeof VoidInvoiceSchema>;

// Payment Receipt DTO
export const PaymentReceiptSchema = z.object({
  id: z.string().uuid(),
  paymentId: z.string().uuid(),
  receiptNumber: z.string(),
  issuedAt: z.string(),
  createdAt: z.string(),
});
export type PaymentReceiptDto = z.infer<typeof PaymentReceiptSchema>;

// Operational & Financial Reports
export const OperationalReportsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  technicianId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  serviceAreaId: z.string().uuid().optional(),
});
export type OperationalReportsQuery = z.input<typeof OperationalReportsQuerySchema>;

export interface OperationalReportsOverviewDto {
  period: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  kpi: {
    totalBookings: number;
    confirmedBookings: number;
    completedWorkOrders: number;
    cancelledBookings: number;
    followUpRequired: number;
    totalInvoicesIssued: number;
    totalInvoicedAmount: string;
    totalVerifiedReceivedAmount: string;
    totalOutstandingAmount: string;
    averageWorkOrderDurationMinutes: number;
  };
  bookingTrends: Array<{
    date: string;
    total: number;
    confirmed: number;
    cancelled: number;
  }>;
  serviceDistribution: Array<{
    serviceName: string;
    count: number;
    percentage: number;
  }>;
  technicianPerformance: Array<{
    technicianId: string;
    technicianName: string;
    completedJobs: number;
    followUpJobs: number;
    avgDurationMinutes: number;
  }>;
  paymentMethodsBreakdown: Array<{
    method: PaymentMethod;
    verifiedCount: number;
    verifiedAmount: string;
  }>;
}

// Financial Customer Summary
export interface CustomerFinancialSummaryDto {
  bookingCode: string;
  customerName: string;
  serviceName: string;
  workOrderNumber: string;
  workOrderStatus: string;
  hasInvoice: boolean;
  invoice?: {
    invoiceNumber: string;
    status: InvoiceStatus;
    issuedAt: string | null;
    grandTotal: string;
    verifiedPaidTotal: string;
    outstandingBalance: string;
    items: Array<{
      description: string;
      quantity: number;
      lineTotal: string;
    }>;
    verifiedPayments: Array<{
      method: PaymentMethod;
      amount: string;
      verifiedAt: string;
      receiptNumber?: string | null;
    }>;
  } | null;
}
