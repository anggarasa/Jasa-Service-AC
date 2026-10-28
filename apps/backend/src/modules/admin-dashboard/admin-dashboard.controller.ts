import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @ApiOperation({ summary: 'Ringkasan KPI metrik dan agenda hari ini' })
  @Get('overview')
  getOverview() {
    return this.adminDashboardService.getOverview();
  }
}
