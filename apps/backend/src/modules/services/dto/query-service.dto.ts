import { ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueryServiceDto {
  @ApiPropertyOptional({ description: 'Pencarian nama atau deskripsi layanan' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID kategori' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: PriceType, description: 'Filter berdasarkan tipe harga' })
  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @ApiPropertyOptional({ description: 'Filter status aktif' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 1, description: 'Halaman data (1-based)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Jumlah data per halaman' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
