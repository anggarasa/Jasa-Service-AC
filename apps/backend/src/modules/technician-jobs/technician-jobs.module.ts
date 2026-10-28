import { Module } from '@nestjs/common';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { TechnicianJobsController } from './technician-jobs.controller';
import { TechnicianJobsService } from './technician-jobs.service';

@Module({
  imports: [AuthModule, StorageModule],
  controllers: [TechnicianJobsController],
  providers: [TechnicianJobsService],
  exports: [TechnicianJobsService],
})
export class TechnicianJobsModule {}
