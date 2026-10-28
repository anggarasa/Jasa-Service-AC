import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceAreaDto {
  @ApiProperty({ example: 'Jakarta Selatan (Kebayoran & Sekitarnya)', description: 'Nama area layanan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama area wajib diisi' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'DKI Jakarta', description: 'Provinsi' })
  @IsString()
  @IsNotEmpty({ message: 'Provinsi wajib diisi' })
  @MaxLength(100)
  province!: string;

  @ApiProperty({ example: 'Jakarta Selatan', description: 'Kota/Kabupaten' })
  @IsString()
  @IsNotEmpty({ message: 'Kota wajib diisi' })
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'Kebayoran Baru', description: 'Kecamatan / Distrik cakupan' })
  @IsString()
  @IsNotEmpty({ message: 'Kecamatan wajib diisi' })
  @MaxLength(100)
  district!: string;

  @ApiPropertyOptional({ example: 25000, description: 'Biaya/ongkos kunjungan area (Rp)' })
  @IsOptional()
  @IsNumber({}, { message: 'Biaya kunjungan harus berupa angka numerik' })
  @Min(0, { message: 'Biaya kunjungan tidak boleh negatif' })
  visitFee?: number;

  @ApiPropertyOptional({ example: 30, description: 'Estimasi durasi perjalanan teknisi dalam menit' })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Estimasi perjalanan tidak boleh negatif' })
  estimatedTravelMinutes?: number;

  @ApiPropertyOptional({ example: 0, description: 'Urutan tampilan dalam daftar' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'Status keaktifan area' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
