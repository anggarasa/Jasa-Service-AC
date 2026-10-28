import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { MediaModule } from '../media/media.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [PrismaModule, StorageModule, MediaModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
