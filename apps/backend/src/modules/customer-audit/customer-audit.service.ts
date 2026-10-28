import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CustomerAuditAction } from '@prisma/client';

export interface LogCustomerAuditParams {
  businessId: string;
  customerId: string;
  actorUserId?: string | null;
  action: CustomerAuditAction;
  changedFields?: Record<string, any> | null;
  reason?: string | null;
}

@Injectable()
export class CustomerAuditService {
  private readonly logger = new Logger(CustomerAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: LogCustomerAuditParams): Promise<void> {
    try {
      await this.prisma.customerAuditLog.create({
        data: {
          businessId: params.businessId,
          customerId: params.customerId,
          actorUserId: params.actorUserId || null,
          action: params.action,
          changedFields: params.changedFields ? (params.changedFields as any) : undefined,
          reason: params.reason || null,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to record customer audit log [${params.action}]: ${msg}`);
    }
  }

  async getLogsByCustomerId(businessId: string, customerId: string) {
    return this.prisma.customerAuditLog.findMany({
      where: { businessId, customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
