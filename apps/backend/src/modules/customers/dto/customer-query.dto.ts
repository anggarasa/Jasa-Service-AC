import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CustomerQueryDto {
  @ApiPropertyOptional({ description: 'Pencarian nama, kode, atau nomor telepon' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter status', enum: ['all', 'active', 'archived'], default: 'active' })
  @IsOptional()
  @IsIn(['all', 'active', 'archived'])
  status?: 'all' | 'active' | 'archived' = 'active';

  @ApiPropertyOptional({ description: 'Halaman data', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Batas data per halaman', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Kolom pengurutan', enum: ['createdAt', 'name', 'customerCode'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'name', 'customerCode'])
  sortBy?: 'createdAt' | 'name' | 'customerCode' = 'createdAt';

  @ApiPropertyOptional({ description: 'Arah pengurutan', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
