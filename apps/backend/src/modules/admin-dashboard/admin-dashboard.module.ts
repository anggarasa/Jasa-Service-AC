import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {}
