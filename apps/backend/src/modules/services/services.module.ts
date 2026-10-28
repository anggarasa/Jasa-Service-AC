import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
