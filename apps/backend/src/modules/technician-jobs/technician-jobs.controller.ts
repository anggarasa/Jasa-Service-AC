import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, WorkOrderPhotoCategory } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/token-payload';
import {
  ArriveWorkOrderDto,
  CompleteWorkOrderDto,
  FollowUpWorkOrderDto,
  SaveServiceReportDto,
  SaveUnitInspectionDto,
  StartWorkOrderDto,
  TechnicianJobsQueryDto,
  UpdateChecklistItemDto,
} from './dto/technician-jobs.dto';
import { TechnicianJobsService } from './technician-jobs.service';

@ApiTags('Technician Workspace & Field Service')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('technician')
export class TechnicianJobsController {
  constructor(private readonly service: TechnicianJobsService) {}

  @Get('dashboard')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Ringkasan dashboard teknisi (metrik & pekerjaan hari ini)' })
  @ApiResponse({ status: 200, description: 'Dashboard teknisi berhasil dimuat' })
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getDashboard(user.id);
  }

  @Get('work-orders')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Daftar Surat Perintah Kerja (SPK) yang ditugaskan ke teknisi' })
  @ApiResponse({ status: 200, description: 'Daftar SPK teknisi berhasil dimuat' })
  async getMyWorkOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TechnicianJobsQueryDto,
  ) {
    return this.service.getMyWorkOrders(user.id, query);
  }

  @Get('work-orders/:id')
  @Roles(UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Detail SPK lengkap untuk eksekusi teknisi di lapangan' })
  @ApiResponse({ status: 200, description: 'Detail SPK teknisi berhasil dimuat' })
  async getMyWorkOrderDetail(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.getMyWorkOrderDetail(user.id, id);
  }

  @Post('work-orders/:id/start-journey')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Mulai perjalanan menuju lokasi pelanggan (Status -> ON_THE_WAY)' })
  @ApiResponse({ status: 200, description: 'Status berhasil diperbarui menjadi ON_THE_WAY' })
  async startJourney(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.startJourney(user.id, id);
  }

  @Post('work-orders/:id/arrive')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Check-in tiba di lokasi pelanggan (Status -> ARRIVED)' })
  @ApiResponse({ status: 200, description: 'Check-in kedatangan berhasil dicatat' })
  async arrive(
    @Param('id') id: string,
    @Body() dto: ArriveWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.arrive(user.id, id, dto);
  }

  @Post('work-orders/:id/start')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Mulai pengerjaan servis AC di lokasi (Status -> IN_PROGRESS)' })
  @ApiResponse({ status: 200, description: 'Pengerjaan servis dimulai' })
  async startWork(
    @Param('id') id: string,
    @Body() dto: StartWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.startWork(user.id, id, dto);
  }

  @Put('work-orders/:id/items/:itemId/inspection')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Menyimpan data inspeksi teknis per unit AC' })
  @ApiResponse({ status: 200, description: 'Inspeksi unit AC berhasil disimpan' })
  async saveUnitInspection(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: SaveUnitInspectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.saveUnitInspection(user.id, id, itemId, dto);
  }

  @Put('work-orders/:id/checklist/:checklistItemId')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Memperbarui status item checklist servis AC' })
  @ApiResponse({ status: 200, description: 'Item checklist berhasil diperbarui' })
  async updateChecklistItem(
    @Param('id') id: string,
    @Param('checklistItemId') checklistItemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.updateChecklistItem(user.id, id, checklistItemId, dto);
  }

  @Post('work-orders/:id/photos')
  @Roles(UserRole.TECHNICIAN)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mengunggah foto dokumentasi pengerjaan servis AC (Before/During/After/Issue)' })
  @ApiResponse({ status: 201, description: 'Foto dokumentasi berhasil disimpan' })
  async uploadPhoto(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!req.file) {
      throw new BadRequestException('Metode unggah berkas multipart tidak tersedia pada request.');
    }

    const part = await req.file();
    if (!part) {
      throw new BadRequestException('Berkas foto tidak ditemukan.');
    }

    const buffer = await part.toBuffer();
    const categoryField = (part.fields?.category as any)?.value;
    const workOrderItemId = (part.fields?.workOrderItemId as any)?.value;
    const caption = (part.fields?.caption as any)?.value;

    const category =
      categoryField && Object.values(WorkOrderPhotoCategory).includes(categoryField)
        ? (categoryField as WorkOrderPhotoCategory)
        : WorkOrderPhotoCategory.BEFORE;

    return this.service.uploadPhoto(
      user.id,
      id,
      buffer,
      part.filename,
      category,
      workOrderItemId,
      caption,
    );
  }

  @Delete('work-orders/:id/photos/:photoId')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Menghapus foto dokumentasi sebelum pekerjaan diselesaikan' })
  @ApiResponse({ status: 200, description: 'Foto dokumentasi berhasil dihapus' })
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.deletePhoto(user.id, id, photoId);
  }

  @Get('work-orders/:id/photos/:photoId/content')
  @Roles(UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Akses aman berkas foto dokumentasi SPK dari MinIO' })
  async getPhotoContent(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: FastifyReply,
  ) {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.OWNER;
    const { asset, stream, presignedUrl } = await this.service.getPhotoContent(
      user.id,
      id,
      photoId,
      isAdmin,
    );

    if (stream) {
      res.header('Content-Type', asset.mimeType);
      res.header('Cache-Control', 'private, max-age=3600');
      return res.send(stream);
    }

    return res.redirect(presignedUrl, 302);
  }

  @Put('work-orders/:id/report')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Menyimpan laporan servis akhir teknisi' })
  @ApiResponse({ status: 200, description: 'Laporan servis teknisi berhasil disimpan' })
  async saveServiceReport(
    @Param('id') id: string,
    @Body() dto: SaveServiceReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.saveServiceReport(user.id, id, dto);
  }

  @Post('work-orders/:id/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Menyelesaikan SPK dengan validasi inspeksi, checklist, dan laporan servis' })
  @ApiResponse({ status: 200, description: 'SPK berhasil diselesaikan dan status disinkronkan' })
  async completeWorkOrder(
    @Param('id') id: string,
    @Body() dto: CompleteWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.completeWorkOrder(user.id, id, dto);
  }

  @Post('work-orders/:id/follow-up')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Mengajukan status tindak lanjut/suku cadang tambahan' })
  @ApiResponse({ status: 200, description: 'Status tindak lanjut berhasil dicatat' })
  async followUpWorkOrder(
    @Param('id') id: string,
    @Body() dto: FollowUpWorkOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.followUpWorkOrder(user.id, id, dto);
  }
}
