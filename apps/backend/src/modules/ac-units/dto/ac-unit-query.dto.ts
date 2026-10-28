import { ApiPropertyOptional } from '@nestjs/swagger';
import { AcType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AcUnitQueryDto {
  @ApiPropertyOptional({ description: 'Pencarian kode, merk, tipe, label unit, atau nama pelanggan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter merk / brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Filter tipe AC', enum: AcType })
  @IsOptional()
  @IsEnum(AcType)
  type?: AcType;

  @ApiPropertyOptional({ description: 'Filter kapasitas PK' })
  @IsOptional()
  @IsString()
  capacityPk?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan customer ID' })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan customer address ID' })
  @IsOptional()
  @IsUUID('4')
  customerAddressId?: string;

  @ApiPropertyOptional({ description: 'Filter status', enum: ['all', 'active', 'archived'], default: 'active' })
  @IsOptional()
  @IsIn(['all', 'active', 'archived'])
  status?: 'all' | 'active' | 'archived' = 'active';

  @ApiPropertyOptional({ description: 'Halaman', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Batas per halaman', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Kolom pengurutan', enum: ['createdAt', 'unitCode', 'unitLabel', 'brand'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'unitCode', 'unitLabel', 'brand'])
  sortBy?: 'createdAt' | 'unitCode' | 'unitLabel' | 'brand' = 'createdAt';

  @ApiPropertyOptional({ description: 'Arah pengurutan', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
