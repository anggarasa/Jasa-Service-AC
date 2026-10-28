import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType, PricingUnit } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'uuid', description: 'ID kategori layanan AC' })
  @IsString()
  @IsNotEmpty({ message: 'Kategori layanan wajib dipilih' })
  categoryId!: string;

  @ApiProperty({ example: 'Cuci AC Split Standar', description: 'Nama layanan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama layanan wajib diisi' })
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'cuci-ac-standar', description: 'Slug unik layanan' })
  @IsString()
  @IsNotEmpty({ message: 'Slug layanan wajib diisi' })
  @MaxLength(150)
  slug!: string;

  @ApiPropertyOptional({ example: 'Cuci rutin unit indoor & outdoor bertekanan', description: 'Deskripsi singkat' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  shortDescription?: string;

  @ApiProperty({ example: 'Pembersihan menyeluruh evaporator, blower, dan kompresor luar.', description: 'Deskripsi lengkap' })
  @IsString()
  @IsNotEmpty({ message: 'Deskripsi layanan wajib diisi' })
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ enum: PriceType, example: PriceType.FIXED, description: 'Tipe harga layanan' })
  @IsEnum(PriceType, { message: 'Tipe harga tidak valid (FIXED, STARTING_FROM, INSPECTION_REQUIRED)' })
  priceType!: PriceType;

  @ApiPropertyOptional({ example: 75000, description: 'Harga dasar layanan dalam rupiah (opsional untuk INSPECTION_REQUIRED)' })
  @IsOptional()
  @IsNumber({}, { message: 'Harga dasar harus berupa angka numerik' })
  @Min(0, { message: 'Harga dasar tidak boleh negatif' })
  basePrice?: number;

  @ApiPropertyOptional({ enum: PricingUnit, example: PricingUnit.PER_UNIT, description: 'Satuan unit penetapan harga' })
  @IsOptional()
  @IsEnum(PricingUnit, { message: 'Satuan harga tidak valid' })
  pricingUnit?: PricingUnit;

  @ApiPropertyOptional({ example: 60, description: 'Estimasi durasi pengerjaan dalam menit' })
  @IsOptional()
  @IsInt()
  @Min(15, { message: 'Durasi minimal 15 menit' })
  @Max(600)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ example: 15, description: 'Buffer waktu tambahan dalam menit' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  additionalBufferMinutes?: number;

  @ApiPropertyOptional({ example: 1, description: 'Jumlah unit AC minimum per order' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minimumUnits?: number;

  @ApiPropertyOptional({ example: 10, description: 'Jumlah unit AC maksimum per order' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maximumUnits?: number;

  @ApiPropertyOptional({ example: 'services/images/photo.webp', description: 'Object key cover image di MinIO' })
  @IsOptional()
  @IsString()
  imageObjectKey?: string;

  @ApiPropertyOptional({ example: 0, description: 'Urutan tampilan dalam katalog' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'Status keaktifan layanan' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
