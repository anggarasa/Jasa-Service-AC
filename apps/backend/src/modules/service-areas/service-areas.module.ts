import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ServiceAreasController } from './service-areas.controller';
import { ServiceAreasService } from './service-areas.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ServiceAreasController],
  providers: [ServiceAreasService],
  exports: [ServiceAreasService],
})
export class ServiceAreasModule {}
