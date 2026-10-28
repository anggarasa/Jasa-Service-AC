import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { BookingCodeService } from '../bookings/services/booking-code.service';
import { BookingPricingService } from '../bookings/services/booking-pricing.service';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';

@Module({
  imports: [PrismaModule, AuthModule, BookingsModule, GoogleCalendarModule],
  controllers: [AdminBookingsController],
  providers: [
    AdminBookingsService,
    BookingCodeService,
    BookingPricingService,
  ],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
