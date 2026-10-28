import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  CreateChargeApprovalDto,
  SaveWorkOrderPricingDto,
} from '../dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getWorkOrderPricing(workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        booking: {
          include: {
            bookingItems: true,
          },
        },
        items: true,
        charges: {
          orderBy: { createdAt: 'asc' },
        },
        materials: {
          orderBy: { createdAt: 'asc' },
        },
        chargeApprovals: {
          orderBy: { createdAt: 'desc' },
          include: {
            approvalEvidenceMedia: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            grandTotal: true,
            verifiedPaidTotal: true,
            outstandingBalance: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work Order dengan ID ${workOrderId} tidak ditemukan`);
    }

    // Hitung estimasi awal dari pemesanan (tetap tidak berubah / immutable)
    const originalBooking = workOrder.booking;
    const visitFee = Number(originalBooking?.visitFeeSnapshot || 0);

    let baseServicesTotal = Number(
      originalBooking?.estimatedServicePrice || originalBooking?.estimatedPrice || 0,
    );
    if (baseServicesTotal === 0 && originalBooking?.bookingItems) {
      for (const item of originalBooking.bookingItems) {
        baseServicesTotal += Number(item.unitPriceSnapshot || 0);
      }
    }

    const originalEstimateTotal = Number(
      originalBooking?.estimatedTotal || baseServicesTotal + visitFee,
    );

    // Biaya tenaga kerja tambahan & biaya khusus
    let additionalLaborTotal = 0;
    for (const ch of workOrder.charges) {
      additionalLaborTotal += Number(ch.lineAmount || 0);
    }

    // Material tambahan
    let materialsTotal = 0;
    for (const mat of workOrder.materials) {
      materialsTotal += Number(mat.totalAmount || 0);
    }

    const grossSubtotal = visitFee + baseServicesTotal + additionalLaborTotal + materialsTotal;
    const discountTotal = 0;
    const taxTotal = 0;
    const finalGrandTotal = grossSubtotal - discountTotal + taxTotal;

    const latestApproval = workOrder.chargeApprovals[0];
    const pricingVersion = latestApproval ? latestApproval.pricingVersion : 1;

    return {
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.workOrderNumber,
      bookingCode: originalBooking?.bookingCode,
      status: workOrder.status,
      invoice: workOrder.invoice
        ? {
            id: workOrder.invoice.id,
            invoiceNumber: workOrder.invoice.invoiceNumber,
            status: workOrder.invoice.status,
            grandTotal: workOrder.invoice.grandTotal.toString(),
            verifiedPaidTotal: workOrder.invoice.verifiedPaidTotal.toString(),
            outstandingBalance: workOrder.invoice.outstandingBalance.toString(),
          }
        : null,
      pricingVersion,
      originalEstimate: {
        visitFeeSnapshot: visitFee.toString(),
        baseServicesTotal: baseServicesTotal.toString(),
        estimatedTotal: originalEstimateTotal.toString(),
        items:
          originalBooking?.bookingItems.map((it: any) => ({
            id: it.id,
            serviceName: originalBooking?.serviceNameSnapshot || 'Layanan Servis AC',
            quantity: 1,
            unitPrice: Number(it.unitPriceSnapshot || 0).toString(),
            totalPrice: Number(it.unitPriceSnapshot || 0).toString(),
          })) || [],
      },
      actualCharges: {
        charges: workOrder.charges.map((c: any) => ({
          id: c.id,
          lineType: c.lineType,
          description: c.description,
          quantity: Number(c.quantity),
          unitPrice: Number(c.unitPrice).toString(),
          lineAmount: Number(c.lineAmount).toString(),
          status: c.status,
          approvedAt: c.approvedAt?.toISOString() || null,
        })),
        materials: workOrder.materials.map((m: any) => ({
          id: m.id,
          materialName: m.materialName,
          quantity: Number(m.quantity),
          unit: m.unit,
          unitPrice: Number(m.unitPrice).toString(),
          totalAmount: Number(m.totalAmount).toString(),
          notes: m.notes,
        })),
        additionalLaborTotal: additionalLaborTotal.toString(),
        materialsTotal: materialsTotal.toString(),
        grossSubtotal: grossSubtotal.toString(),
        finalGrandTotal: finalGrandTotal.toString(),
      },
      approvals: workOrder.chargeApprovals.map((a: any) => ({
        id: a.id,
        pricingVersion: a.pricingVersion,
        proposedTotal: Number(a.proposedTotal).toString(),
        approvedTotal: a.approvedTotal ? Number(a.approvedTotal).toString() : null,
        status: a.status,
        approvalMethod: a.approvalMethod,
        approvedByName: a.approvedByName,
        approvedByContact: a.approvedByContact,
        approvedAt: a.approvedAt?.toISOString() || null,
        evidenceMediaUrl: a.approvalEvidenceMedia ? `/api/media/${a.approvalEvidenceMedia.id}/view` : null,
        internalNotes: a.internalNotes,
      })),
    };
  }

  async saveWorkOrderPricing(
    workOrderId: string,
    dto: SaveWorkOrderPricingDto,
    userId: string,
  ) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { invoice: true },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work Order dengan ID ${workOrderId} tidak ditemukan`);
    }

    if (workOrder.invoice && ['ISSUED', 'PARTIALLY_PAID', 'PAID'].includes(workOrder.invoice.status)) {
      throw new ForbiddenException(
        'Faktur untuk SPK ini telah diterbitkan resmi. Rincian biaya terkunci dan tidak dapat diubah.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Hapus charges yang tidak ada di dto
      const incomingChargeIds = dto.charges.filter((c) => c.id).map((c) => c.id as string);
      await tx.workOrderCharge.deleteMany({
        where: {
          workOrderId,
          id: { notIn: incomingChargeIds },
        },
      });

      // Upsert charges
      for (const ch of dto.charges) {
        const lineAmount = ch.quantity * ch.unitPrice;
        if (ch.id) {
          await tx.workOrderCharge.update({
            where: { id: ch.id },
            data: {
              lineType: ch.lineType,
              description: ch.description,
              quantity: new Prisma.Decimal(ch.quantity),
              unitPrice: new Prisma.Decimal(ch.unitPrice),
              lineAmount: new Prisma.Decimal(lineAmount),
              status: ch.status || 'DRAFT',
            },
          });
        } else {
          await tx.workOrderCharge.create({
            data: {
              workOrderId,
              workOrderItemId: ch.workOrderItemId || null,
              lineType: ch.lineType,
              description: ch.description,
              quantity: new Prisma.Decimal(ch.quantity),
              unitPrice: new Prisma.Decimal(ch.unitPrice),
              lineAmount: new Prisma.Decimal(lineAmount),
              status: ch.status || 'DRAFT',
              proposedByUserId: userId,
            },
          });
        }
      }

      // Hapus materials yang tidak ada di dto
      const incomingMaterialIds = dto.materials.filter((m) => m.id).map((m) => m.id as string);
      await tx.workOrderMaterial.deleteMany({
        where: {
          workOrderId,
          id: { notIn: incomingMaterialIds },
        },
      });

      // Upsert materials
      for (const mat of dto.materials) {
        const totalAmount = mat.quantity * mat.unitPrice;
        if (mat.id) {
          await tx.workOrderMaterial.update({
            where: { id: mat.id },
            data: {
              materialName: mat.materialName,
              quantity: new Prisma.Decimal(mat.quantity),
              unit: mat.unit,
              unitPrice: new Prisma.Decimal(mat.unitPrice),
              totalAmount: new Prisma.Decimal(totalAmount),
              notes: mat.notes || null,
            },
          });
        } else {
          await tx.workOrderMaterial.create({
            data: {
              workOrderId,
              workOrderItemId: mat.workOrderItemId || null,
              materialName: mat.materialName,
              quantity: new Prisma.Decimal(mat.quantity),
              unit: mat.unit,
              unitPrice: new Prisma.Decimal(mat.unitPrice),
              totalAmount: new Prisma.Decimal(totalAmount),
              notes: mat.notes || null,
              recordedByUserId: userId,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Rincian biaya dan material SPK berhasil disimpan',
      };
    });
  }

  async createChargeApproval(
    workOrderId: string,
    dto: CreateChargeApprovalDto,
    userId: string,
  ) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        chargeApprovals: {
          orderBy: { pricingVersion: 'desc' },
          take: 1,
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException(`Work Order dengan ID ${workOrderId} tidak ditemukan`);
    }

    const currentVersion = workOrder.chargeApprovals[0]?.pricingVersion || 0;
    const nextVersion = currentVersion + 1;

    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.serviceChargeApproval.create({
        data: {
          workOrderId,
          pricingVersion: nextVersion,
          proposedTotal: new Prisma.Decimal(dto.proposedTotal),
          approvedTotal: dto.approvedTotal ? new Prisma.Decimal(dto.approvedTotal) : new Prisma.Decimal(dto.proposedTotal),
          status: 'APPROVED',
          approvalMethod: dto.approvalMethod,
          approvedByName: dto.approvedByName,
          approvedByContact: dto.approvedByContact || null,
          approvalEvidenceMediaId: dto.approvalEvidenceMediaId || null,
          approvedAt: new Date(),
          recordedByUserId: userId,
          internalNotes: dto.internalNotes || null,
        },
      });

      // Tandai semua charges saat ini sebagai APPROVED
      await tx.workOrderCharge.updateMany({
        where: { workOrderId },
        data: {
          status: 'APPROVED',
          approvedByUserId: userId,
          approvedAt: new Date(),
        },
      });

      // Catat log audit finansial
      await tx.financialAuditLog.create({
        data: {
          businessId: workOrder.businessId,
          aggregateType: 'WORK_ORDER',
          aggregateId: workOrderId,
          action: 'CHARGE_APPROVED',
          performedByUserId: userId,
          newState: {
            approvalId: approval.id,
            version: nextVersion,
            proposedTotal: dto.proposedTotal,
            approvedTotal: dto.approvedTotal || dto.proposedTotal,
            approvedByName: dto.approvedByName,
            approvalMethod: dto.approvalMethod,
          },
        },
      });

      return {
        success: true,
        message: `Persetujuan biaya versi ${nextVersion} berhasil dicatat`,
        data: approval,
      };
    });
  }
}
