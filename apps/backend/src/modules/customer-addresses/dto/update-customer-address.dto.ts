import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateCustomerAddressDto {
  @ApiPropertyOptional({ description: 'Label alamat' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiPropertyOptional({ description: 'Nama penerima di lokasi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string | null;

  @ApiPropertyOptional({ description: 'Nomor telepon penerima' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  recipientPhone?: string | null;

  @ApiPropertyOptional({ description: 'Alamat lengkap' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  fullAddress?: string;

  @ApiPropertyOptional({ description: 'Provinsi' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ description: 'Kota' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Kecamatan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({ description: 'Kelurahan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subdistrict?: string | null;

  @ApiPropertyOptional({ description: 'Kode pos' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string | null;

  @ApiPropertyOptional({ description: 'Patokan lokasi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string | null;

  @ApiPropertyOptional({ description: 'ID ServiceArea' })
  @IsOptional()
  @IsUUID('4')
  serviceAreaId?: string | null;

  @ApiPropertyOptional({ description: 'Koordinat Latitude' })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ description: 'Koordinat Longitude' })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional({ description: 'Status aktif' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
