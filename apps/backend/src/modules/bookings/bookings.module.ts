import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { BookingsService } from './bookings.service';
import { PublicBookingsController } from './public-bookings.controller';
import { BookingAccessService } from './services/booking-access.service';
import { BookingCodeService } from './services/booking-code.service';
import { BookingExpirationService } from './services/booking-expiration.service';
import { BookingPricingService } from './services/booking-pricing.service';

@Module({
  imports: [PrismaModule],
  controllers: [PublicBookingsController],
  providers: [
    BookingsService,
    BookingCodeService,
    BookingAccessService,
    BookingPricingService,
    BookingExpirationService,
  ],
  exports: [BookingsService, BookingExpirationService],
})
export class BookingsModule {}
