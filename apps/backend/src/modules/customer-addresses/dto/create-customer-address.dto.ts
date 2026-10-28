import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerAddressDto {
  @ApiProperty({ description: 'Label alamat (Rumah, Kantor, Ruko, dsb)', example: 'Rumah' })
  @IsString({ message: 'Label harus berupa string' })
  @IsNotEmpty({ message: 'Label alamat wajib diisi' })
  @MaxLength(50, { message: 'Label alamat maksimal 50 karakter' })
  label: string;

  @ApiPropertyOptional({ description: 'Nama penerima di lokasi', example: 'Ibu Anita' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string | null;

  @ApiPropertyOptional({ description: 'Nomor telepon penerima di lokasi', example: '081298765432' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  recipientPhone?: string | null;

  @ApiProperty({ description: 'Alamat lengkap', example: 'Jl. Senopati No. 45, RT 02/RW 03' })
  @IsString()
  @IsNotEmpty({ message: 'Alamat lengkap wajib diisi' })
  @MinLength(5, { message: 'Alamat lengkap minimal 5 karakter' })
  @MaxLength(500, { message: 'Alamat lengkap maksimal 500 karakter' })
  fullAddress: string;

  @ApiPropertyOptional({ description: 'Provinsi', example: 'DKI Jakarta', default: 'DKI Jakarta' })
  @IsOptional()
  @IsString()
  province?: string = 'DKI Jakarta';

  @ApiProperty({ description: 'Kota / Kabupaten', example: 'Jakarta Selatan' })
  @IsString()
  @IsNotEmpty({ message: 'Kota wajib diisi' })
  @MaxLength(100)
  city: string;

  @ApiProperty({ description: 'Kecamatan', example: 'Kebayoran Baru' })
  @IsString()
  @IsNotEmpty({ message: 'Kecamatan wajib diisi' })
  @MaxLength(100)
  district: string;

  @ApiPropertyOptional({ description: 'Kelurahan', example: 'Senayan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subdistrict?: string | null;

  @ApiPropertyOptional({ description: 'Kode pos', example: '12190' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string | null;

  @ApiPropertyOptional({ description: 'Patokan lokasi', example: 'Sebelah minimarket Indomaret' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string | null;

  @ApiPropertyOptional({ description: 'ID ServiceArea jika terverifikasi' })
  @IsOptional()
  @IsUUID('4', { message: 'serviceAreaId harus berupa UUID valid' })
  serviceAreaId?: string | null;

  @ApiPropertyOptional({ description: 'Koordinat Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ description: 'Koordinat Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional({ description: 'Jadikan sebagai alamat utama', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;
}
