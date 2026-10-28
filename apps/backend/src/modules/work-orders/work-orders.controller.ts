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
import {
  AssignWorkOrderTechnicianDto,
  CancelWorkOrderDto,
  CreateWorkOrderDto,
  UpdateWorkOrderStatusDto,
  WorkOrderListQueryDto,
} from './dto/work-order.dto';
import { WorkOrdersService } from './work-orders.service';

@ApiTags('Admin Work Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
@Controller('admin/work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) { }

  @ApiOperation({ summary: 'Daftar Surat Perintah Kerja (SPK)' })
  @Get()
  async listWorkOrders(@Query() query: WorkOrderListQueryDto) {
    return this.workOrdersService.listWorkOrders(query);
  }

  @ApiOperation({ summary: 'Detail Surat Perintah Kerja (SPK)' })
  @Get(':id')
  getWorkOrderById(@Param('id') id: string) {
    return this.workOrdersService.getWorkOrderById(id);
  }

  @ApiOperation({ summary: 'Buat Surat Perintah Kerja (SPK) dari pemesanan' })
  @Post()
  createFromBooking(
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.workOrdersService.createFromBooking(dto, actorUserId);
  }

  @ApiOperation({ summary: 'Perbarui status / progres Surat Perintah Kerja' })
  @Patch(':id')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.workOrdersService.updateStatus(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Tugaskan / alihkan teknisi pada SPK' })
  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  assignTechnician(
    @Param('id') id: string,
    @Body() dto: AssignWorkOrderTechnicianDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.workOrdersService.assignTechnician(id, dto, actorUserId);
  }

  @ApiOperation({ summary: 'Batalkan Surat Perintah Kerja' })
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelWorkOrder(
    @Param('id') id: string,
    @Body() dto: CancelWorkOrderDto,
    @CurrentUser('id') actorUserId: string,
  ) {
    return this.workOrdersService.cancelWorkOrder(id, dto, actorUserId);
  }
}
