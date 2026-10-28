import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConflictsQueryDto, ResolveConflictDto } from '../dto/google-calendar.dto';
import { CalendarConflictService } from '../services/calendar-conflict.service';

@ApiTags('Google Calendar Conflicts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/integrations/google/conflicts')
export class GoogleConflictController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conflictService: CalendarConflictService,
  ) {}

  private async getBusinessId(): Promise<string> {
    const business = await this.prisma.business.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    return business?.id || '';
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Daftar konflik sinkronisasi Google Calendar' })
  @ApiResponse({ status: 200, description: 'Daftar konflik berhasil diambil' })
  async listConflicts(@Query() query: ConflictsQueryDto) {
    const businessId = await this.getBusinessId();
    return this.conflictService.listConflicts(
      businessId,
      query.page || 1,
      query.limit || 10,
      query.status || 'OPEN',
    );
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Detail konflik sinkronisasi Google Calendar berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail konflik' })
  async getConflictById(@Param('id') id: string) {
    return this.conflictService.getConflictById(id);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Selesaikan konflik sinkronisasi Google Calendar' })
  @ApiResponse({ status: 200, description: 'Konflik berhasil diselesaikan' })
  async resolveConflict(
    @Param('id') id: string,
    @Body() dto: ResolveConflictDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || req.user?.userId;
    return this.conflictService.resolveConflict(
      id,
      dto.action,
      userId,
      dto.resolutionNotes,
    );
  }
}
