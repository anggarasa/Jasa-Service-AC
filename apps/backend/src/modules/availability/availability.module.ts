import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { AvailabilityService } from './availability.service';
import { PublicAvailabilityController } from './public-availability.controller';

@Module({
  imports: [PrismaModule, GoogleCalendarModule],
  controllers: [PublicAvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
