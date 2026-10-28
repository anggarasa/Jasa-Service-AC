import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { BookingsService } from './bookings.service';
import { CreateGuestBookingDto } from './dto/create-guest-booking.dto';
import { BookingExpirationService } from './services/booking-expiration.service';

@ApiTags('Public Bookings')
@Public()
@Controller('public/bookings')
export class PublicBookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly expirationService: BookingExpirationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Membuat reservasi pemesanan servis AC baru (Guest Checkout)' })
  @ApiResponse({ status: 201, description: 'Pemesanan berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Validasi data masukan gagal' })
  @ApiResponse({ status: 409, description: 'Kapasitas slot teknisi penuh atau conflict' })
  async createBooking(@Body() dto: CreateGuestBookingDto) {
    return this.bookingsService.createGuestBooking(dto);
  }

  @Get('manage')
  @ApiOperation({ summary: 'Melihat detail status pemesanan menggunakan token akses aman' })
  @ApiResponse({ status: 200, description: 'Detail pemesanan berhasil dimuat' })
  @ApiResponse({ status: 401, description: 'Token akses tidak valid atau kedaluwarsa' })
  async getBookingDetails(
    @Query('token') queryToken?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    let token = queryToken;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      throw new UnauthorizedException('Token akses pemesanan wajib disertakan.');
    }

    return this.bookingsService.getBookingByToken(token);
  }

  @Post('process-expirations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Memproses pembebasan kapasitas pemesanan pending yang kedaluwarsa' })
  @ApiResponse({ status: 200, description: 'Proses kedaluwarsa selesai' })
  async processExpirations() {
    const expiredCount = await this.expirationService.processExpiredHolds();
    return {
      success: true,
      data: {
        expiredCount,
      },
    };
  }
}
