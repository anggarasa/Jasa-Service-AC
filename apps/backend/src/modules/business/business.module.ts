import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule],
  controllers: [BusinessController],
  providers: [BusinessService],
  exports: [BusinessService],
})
export class BusinessModule {}
