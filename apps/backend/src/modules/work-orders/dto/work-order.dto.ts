import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateWorkOrderDto {
  @ApiProperty({ description: 'ID Pemesanan yang akan dijadikan Surat Perintah Kerja (SPK)' })
  @IsNotEmpty({ message: 'ID Pemesanan wajib diisi' })
  @IsUUID('4', { message: 'ID Pemesanan tidak valid' })
  bookingId: string;

  @ApiPropertyOptional({ description: 'ID Teknisi jika ingin dialokasikan spesifik' })
  @IsOptional()
  @IsUUID('4', { message: 'ID Teknisi tidak valid' })
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Instruksi admin untuk teknisi' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminInstructions?: string;

  @ApiPropertyOptional({ enum: WorkOrderStatus, default: WorkOrderStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus = WorkOrderStatus.SCHEDULED;
}

export class UpdateWorkOrderStatusDto {
  @ApiProperty({ enum: WorkOrderStatus, description: 'Status baru SPK' })
  @IsNotEmpty({ message: 'Status SPK wajib diisi' })
  @IsEnum(WorkOrderStatus, { message: 'Status SPK tidak valid' })
  status: WorkOrderStatus;

  @ApiPropertyOptional({ description: 'Alasan perubahan status' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({ description: 'Diagnosa teknisi di lapangan' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Catatan teknisi setelah pengerjaan' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  technicianNotes?: string;
}

export class AssignWorkOrderTechnicianDto {
  @ApiProperty({ description: 'ID Teknisi baru yang ditugaskan' })
  @IsNotEmpty({ message: 'ID Teknisi wajib diisi' })
  @IsUUID('4', { message: 'ID Teknisi tidak valid' })
  technicianId: string;

  @ApiPropertyOptional({ description: 'Alasan penugasan / pengalihan' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CancelWorkOrderDto {
  @ApiProperty({ description: 'Alasan pembatalan SPK' })
  @IsNotEmpty({ message: 'Alasan pembatalan wajib diisi' })
  @IsString()
  @MinLength(3, { message: 'Alasan pembatalan minimal 3 karakter' })
  @MaxLength(500, { message: 'Alasan pembatalan maksimal 500 karakter' })
  reason: string;
}

export class WorkOrderListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Pencarian nomor SPK, nama pelanggan, telepon, kode booking' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WorkOrderStatus })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Teknisi' })
  @IsOptional()
  @IsString()
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal mulai YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter tanggal akhir YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format endDate harus YYYY-MM-DD' })
  endDate?: string;
}
