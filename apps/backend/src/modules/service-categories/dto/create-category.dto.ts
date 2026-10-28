import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Cuci AC (Cleaning)', description: 'Nama kategori layanan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori wajib diisi' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'cuci-ac', description: 'Slug unik kategori' })
  @IsString()
  @IsNotEmpty({ message: 'Slug kategori wajib diisi' })
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional({ example: 'Layanan pembersihan unit AC indoor dan outdoor bertekanan', description: 'Deskripsi singkat kategori' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 0, description: 'Urutan tampilan kategori (angka non-negatif)' })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Urutan tampilan tidak boleh bernilai negatif' })
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'Status keaktifan kategori' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
