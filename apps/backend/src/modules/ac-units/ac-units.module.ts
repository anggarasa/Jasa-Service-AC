import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { CustomerAuditModule } from '../customer-audit/customer-audit.module';
import { CustomersModule } from '../customers/customers.module';
import { AcUnitPhotosController } from './ac-unit-photos.controller';
import { AcUnitsController } from './ac-units.controller';
import { AcUnitsService } from './ac-units.service';

@Module({
  imports: [PrismaModule, CustomersModule, StorageModule, AuthModule, CustomerAuditModule],
  controllers: [AcUnitsController, AcUnitPhotosController],
  providers: [AcUnitsService],
  exports: [AcUnitsService],
})
export class AcUnitsModule {}
