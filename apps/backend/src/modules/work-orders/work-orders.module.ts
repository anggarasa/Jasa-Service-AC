import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
