import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BusinessClosuresService } from './business-closures.service';
import { CreateClosureDto } from './dto/create-closure.dto';
import { UpdateClosureDto } from './dto/update-closure.dto';

@ApiTags('Admin Closures')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/business/closures')
export class BusinessClosuresController {
  constructor(private readonly closuresService: BusinessClosuresService) {}

  @Get()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan daftar hari libur dan penutupan operasional' })
  @ApiResponse({ status: 200, description: 'Daftar penutupan berhasil dimuat' })
  async findAll() {
    return this.closuresService.findAll();
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menambahkan jadwal libur/penutupan operasional baru' })
  @ApiResponse({ status: 201, description: 'Penutupan operasional berhasil dibuat' })
  async create(@Body() dto: CreateClosureDto) {
    return this.closuresService.create(dto);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mendapatkan detail penutupan operasional berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.closuresService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Memperbarui data hari libur/penutupan operasional' })
  async update(@Param('id') id: string, @Body() dto: UpdateClosureDto) {
    return this.closuresService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Menghapus data hari libur/penutupan operasional' })
  async remove(@Param('id') id: string) {
    return this.closuresService.remove(id);
  }
}
