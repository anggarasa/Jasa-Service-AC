import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ServiceCategoriesController],
  providers: [ServiceCategoriesService],
  exports: [ServiceCategoriesService],
})
export class ServiceCategoriesModule {}
