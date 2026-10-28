import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminBookingsService } from './admin-bookings.service';
import {
  AdminAssignTechnicianDto,
  AdminCancelBookingDto,
  AdminConfirmBookingDto,
  AdminReassignTechnicianDto,
  AdminRejectBookingDto,
  AdminRescheduleBookingDto,
  AdminUpdateInternalNotesDto,
} from './dto/admin-booking-actions.dto';
import { AdminBookingListQueryDto } from './dto/admin-booking-list-query.dto';
import {
  AdminCalendarQueryDto,
  AdminCreateManualBookingDto,
  TechnicianScheduleQueryDto,
} from './dto/admin-booking-queries.dto';

@ApiTags('Admin Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin')
export class AdminBookingsController {
  constructor(private readonly adminBookingsService: AdminBookingsService) {}

  @ApiOperation({ summary: 'Daftar pemesanan servis (Admin)' })
  @Get('bookings')
  async listBookings(@Query() query: AdminBookingListQueryDto) {
    return this.adminBookingsService.listBookings(query);
  }

  @ApiOperation({ summary: 'Jadwal kalender pemesanan servis' })
  @Get('bookings/calendar')
  getCalendarEvents(@Query() query: AdminCalendarQueryDto) {
    return this.adminBookingsService.getCalendarEvents(query);
  }

  @ApiOperation({ summary: 'Ikhtisar jadwal dan tugas teknisi' })
  @Get('technicians/schedule')
  getTechniciansSchedule(@Query() query: TechnicianScheduleQueryDto) {
    return this.adminBookingsService.getTechniciansSchedule(query);
  }

  @ApiOperation({ summary: 'Detail pemesanan servis' })
  @Get('bookings/:id')
  getBookingDetail(@Param('id') id: string) {
    return this.adminBookingsService.getBookingById(id);
  }

  @ApiOperation({ summary: 'Buat pemesanan servis manual oleh Admin' })
  @Post('bookings')
  createManualBooking(
    @Body() dto: AdminCreateManualBookingDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.createManualBooking(dto, actorUserId);
  }

  @ApiOperation({ summary: 'Konfirmasi pemesanan servis' })
  @Post('bookings/:id/confirm')
  @HttpCode(HttpStatus.OK)
  confirmBooking(
    @Param('id') id: string,
    @Body() dto: AdminConfirmBookingDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.confirmBooking(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Tolak pemesanan servis' })
  @Post('bookings/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectBooking(
    @Param('id') id: string,
    @Body() dto: AdminRejectBookingDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.rejectBooking(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Tugaskan teknisi ke pemesanan' })
  @Post('bookings/:id/assign-technician')
  @HttpCode(HttpStatus.OK)
  assignTechnician(
    @Param('id') id: string,
    @Body() dto: AdminAssignTechnicianDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.assignTechnician(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Alihkan teknisi ke pemesanan' })
  @Post('bookings/:id/reassign-technician')
  @HttpCode(HttpStatus.OK)
  reassignTechnician(
    @Param('id') id: string,
    @Body() dto: AdminReassignTechnicianDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.reassignTechnician(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Jadwalkan ulang pemesanan servis' })
  @Post('bookings/:id/reschedule')
  @HttpCode(HttpStatus.OK)
  rescheduleBooking(
    @Param('id') id: string,
    @Body() dto: AdminRescheduleBookingDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.rescheduleBooking(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Batalkan pemesanan servis' })
  @Post('bookings/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelBooking(
    @Param('id') id: string,
    @Body() dto: AdminCancelBookingDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.cancelBooking(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Perbarui catatan internal pemesanan' })
  @Patch('bookings/:id/internal-notes')
  updateInternalNotes(
    @Param('id') id: string,
    @Body() dto: AdminUpdateInternalNotesDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.adminBookingsService.updateInternalNotes(id, dto, actorUserId);
  }
}
