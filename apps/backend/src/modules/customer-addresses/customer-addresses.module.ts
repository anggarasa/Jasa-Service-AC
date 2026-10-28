import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CustomerAuditModule } from '../customer-audit/customer-audit.module';
import { CustomersModule } from '../customers/customers.module';
import { CustomerAddressesController } from './customer-addresses.controller';
import { CustomerAddressesService } from './customer-addresses.service';

@Module({
  imports: [PrismaModule, CustomersModule, AuthModule, CustomerAuditModule],
  controllers: [CustomerAddressesController],
  providers: [CustomerAddressesService],
  exports: [CustomerAddressesService],
})
export class CustomerAddressesModule {}
