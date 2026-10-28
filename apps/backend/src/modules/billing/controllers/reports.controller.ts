import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ExportReportsQueryDto, OperationalReportsQueryDto } from '../dto/reports.dto';
import { ReportsService } from '../services/reports.service';

@ApiTags('Admin Operational & Financial Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Ringkasan Laporan Operasional & Keuangan (KPI Billed vs Received)' })
  @Get('overview')
  async getOverview(@Query() query: OperationalReportsQueryDto) {
    const data = await this.reportsService.getOperationalOverview(query);
    return {
      success: true,
      data,
      message: 'Ringkasan laporan operasional & keuangan berhasil dimuat',
    };
  }

  @ApiOperation({ summary: 'Ekspor Laporan ke Format CSV yang Aman dari Formula Injection' })
  @Get('export')
  async exportCsv(
    @Query() query: ExportReportsQueryDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { filename, content } = await this.reportsService.exportCsv(query);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(content);
  }
}
