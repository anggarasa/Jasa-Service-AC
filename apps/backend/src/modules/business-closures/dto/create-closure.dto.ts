import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateClosureDto {
  @ApiProperty({ example: '2026-12-25T00:00:00.000Z', description: 'Tanggal mulai libur/tutup' })
  @IsDateString({}, { message: 'Format tanggal mulai tidak valid (ISO 8601)' })
  @IsNotEmpty({ message: 'Tanggal mulai wajib diisi' })
  startDate!: string;

  @ApiProperty({ example: '2026-12-26T23:59:59.000Z', description: 'Tanggal selesai libur/tutup' })
  @IsDateString({}, { message: 'Format tanggal selesai tidak valid (ISO 8601)' })
  @IsNotEmpty({ message: 'Tanggal selesai wajib diisi' })
  endDate!: string;

  @ApiProperty({ example: 'Hari Raya Natal & Cuti Bersama', description: 'Alasan penutupan operasional' })
  @IsString()
  @IsNotEmpty({ message: 'Alasan penutupan wajib diisi' })
  @MaxLength(200)
  reason!: string;

  @ApiPropertyOptional({ example: true, description: 'Status keaktifan penutupan' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
