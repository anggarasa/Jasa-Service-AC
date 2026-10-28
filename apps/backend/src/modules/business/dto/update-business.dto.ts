import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsBoolean,
} from 'class-validator';

export class UpdateBusinessDto {
  @ApiProperty({ example: 'CoolCare AC Service', description: 'Nama bisnis' })
  @IsString()
  @IsNotEmpty({ message: 'Nama bisnis wajib diisi' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'coolcare-ac', description: 'Slug unik bisnis' })
  @IsString()
  @IsNotEmpty({ message: 'Slug bisnis wajib diisi' })
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional({ example: 'Layanan spesialis cuci dan servis AC', description: 'Deskripsi bisnis' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 'halo@coolcare.id', description: 'Email resmi bisnis' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email!: string;

  @ApiProperty({ example: '+62 812-3456-7890', description: 'Nomor telepon operasional' })
  @IsString()
  @MinLength(8, { message: 'Nomor telepon minimal 8 digit' })
  @MaxLength(20)
  phone!: string;

  @ApiProperty({ example: '6281234567890', description: 'Nomor WhatsApp bisnis (format internasional)' })
  @IsString()
  @MinLength(8, { message: 'Nomor WhatsApp minimal 8 digit' })
  @MaxLength(20)
  whatsappNumber!: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 45', description: 'Alamat lengkap kantor operasional' })
  @IsString()
  @MinLength(5, { message: 'Alamat lengkap wajib diisi' })
  @MaxLength(255)
  address!: string;

  @ApiProperty({ example: 'Jakarta Selatan', description: 'Kota' })
  @IsString()
  @MinLength(2, { message: 'Kota wajib diisi' })
  @MaxLength(100)
  city!: string;

  @ApiProperty({ example: 'DKI Jakarta', description: 'Provinsi' })
  @IsString()
  @MinLength(2, { message: 'Provinsi wajib diisi' })
  @MaxLength(100)
  province!: string;

  @ApiPropertyOptional({ example: '12160', description: 'Kode Pos' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=-6.2088,106.8456', description: 'Tautan Google Maps' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  googleMapsUrl?: string;

  @ApiPropertyOptional({ example: 'Asia/Jakarta', description: 'Zona waktu bisnis' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'business/logos/logo.webp', description: 'Object key logo di MinIO' })
  @IsOptional()
  @IsString()
  logoObjectKey?: string;

  @ApiPropertyOptional({ example: true, description: 'Status aktif operasional bisnis' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
