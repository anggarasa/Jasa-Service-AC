import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChecklistItemStatus,
  InspectionStatus,
  WorkOrderPhotoCategory,
  WorkOrderStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ArriveWorkOrderDto {
  @ApiPropertyOptional({ description: 'Catatan kedatangan di lokasi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Koordinat lintang teknisi' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Koordinat bujur teknisi' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class StartWorkOrderDto {
  @ApiPropertyOptional({ description: 'Catatan mulai pengerjaan servis' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class FollowUpWorkOrderDto {
  @ApiProperty({ description: 'Alasan mengapa pekerjaan membutuhkan kunjungan lanjutan/sparepart' })
  @IsString({ message: 'Alasan tindak lanjut wajib berupa teks' })
  @MinLength(3, { message: 'Alasan tindak lanjut minimal 3 karakter' })
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan atau suku cadang yang dibutuhkan' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CompleteWorkOrderDto {
  @ApiPropertyOptional({ description: 'Catatan akhir teknisi' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  technicianNotes?: string;

  @ApiPropertyOptional({ description: 'Nama tanda tangan pelanggan penerima' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerSignedName?: string;

  @ApiPropertyOptional({ description: 'Nama tanda tangan teknisi penanggung jawab' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  technicianSignedName?: string;
}

export class SaveUnitInspectionDto {
  @ApiPropertyOptional({ enum: InspectionStatus, default: InspectionStatus.NOT_INSPECTED })
  @IsOptional()
  @IsEnum(InspectionStatus)
  inspectionStatus?: InspectionStatus = InspectionStatus.NOT_INSPECTED;

  @ApiPropertyOptional({ description: 'Keluhan pelanggan yang dilaporkan' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reportedComplaint?: string;

  @ApiPropertyOptional({ description: 'Kondisi fisik dan operasional yang diamati' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observedCondition?: string;

  @ApiPropertyOptional({ description: 'Diagnosa teknisi di lapangan' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Rekomendasi tindakan teknis' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  recommendedAction?: string;

  @ApiPropertyOptional({ description: 'Apakah membutuhkan pengerjaan lanjutan atau suku cadang' })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean = false;
}

export class UpdateChecklistItemDto {
  @ApiProperty({ enum: ChecklistItemStatus, description: 'Status pengerjaan item checklist' })
  @IsEnum(ChecklistItemStatus, { message: 'Status checklist tidak valid' })
  status: ChecklistItemStatus;

  @ApiPropertyOptional({ description: 'Catatan teknis per item checklist' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SaveServiceReportDto {
  @ApiProperty({ description: 'Ringkasan pengerjaan servis' })
  @IsString()
  @MinLength(5, { message: 'Ringkasan pengerjaan minimal 5 karakter' })
  @MaxLength(2000)
  summary: string;

  @ApiProperty({ description: 'Tindakan teknis yang telah dilaksanakan' })
  @IsString()
  @MinLength(5, { message: 'Tindakan yang diambil minimal 5 karakter' })
  @MaxLength(2000)
  workPerformed: string;

  @ApiPropertyOptional({ description: 'Masalah atau kendala yang ditemukan' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  issuesFound?: string;

  @ApiPropertyOptional({ description: 'Rekomendasi perawatan atau pergantian suku cadang' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendations?: string;

  @ApiPropertyOptional({ description: 'Nama perwakilan pelanggan yang menyetujui' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerSignedName?: string;

  @ApiPropertyOptional({ description: 'Nama teknisi pelaksana yang menandatangani' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  technicianSignedName?: string;

  @ApiPropertyOptional({ description: 'Tandai laporan selesai' })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean = false;
}

export class TechnicianJobsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: WorkOrderStatus })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @ApiPropertyOptional({ description: 'Format tanggal YYYY-MM-DD' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' })
  date?: string;

  @ApiPropertyOptional({ description: 'Pencarian nomor SPK, nama pelanggan, alamat' })
  @IsOptional()
  @IsString()
  search?: string;
}
