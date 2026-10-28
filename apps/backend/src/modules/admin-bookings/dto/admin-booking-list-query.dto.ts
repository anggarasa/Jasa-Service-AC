import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class AdminBookingListQueryDto {
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

  @ApiPropertyOptional({ description: 'Pencarian kode booking, nama/telepon pelanggan, layanan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID teknisi' })
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
