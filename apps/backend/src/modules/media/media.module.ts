import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { MediaController } from './media.controller';
import { GalleryController } from './gallery.controller';
import { MediaService } from './media.service';

@Module({
  imports: [PrismaModule, StorageModule, AuthModule],
  controllers: [MediaController, GalleryController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
