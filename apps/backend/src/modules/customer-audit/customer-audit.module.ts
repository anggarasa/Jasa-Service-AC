import { Module } from '@nestjs/common';
import { CustomerAuditService } from './customer-audit.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CustomerAuditService],
  exports: [CustomerAuditService],
})
export class CustomerAuditModule {}
