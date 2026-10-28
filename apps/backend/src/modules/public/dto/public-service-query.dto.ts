import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PublicServiceQueryDto {
  @ApiPropertyOptional({ description: 'Filter berdasarkan slug atau ID kategori' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Pencarian nama atau deskripsi layanan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, description: 'Halaman data (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Jumlah data per halaman (maksimal 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
