import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AvailabilityService } from './availability.service';
import { PublicAvailabilityQueryDto } from './dto/public-availability-query.dto';

@ApiTags('Public Booking Availability')
@Public()
@Controller('public/availability')
export class PublicAvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan jadwal slot waktu servis AC yang tersedia' })
  @ApiResponse({ status: 200, description: 'Slot ketersediaan berhasil dimuat' })
  async getAvailability(@Query() query: PublicAvailabilityQueryDto) {
    return this.availabilityService.getPublicAvailability(query);
  }
}
