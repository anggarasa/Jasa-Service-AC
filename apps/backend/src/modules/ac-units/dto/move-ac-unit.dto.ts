import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class MoveAcUnitDto {
  @ApiProperty({ description: 'ID alamat baru milik pelanggan yang sama' })
  @IsUUID('4', { message: 'newCustomerAddressId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Alamat tujuan baru wajib diisi' })
  newCustomerAddressId: string;

  @ApiPropertyOptional({ description: 'Ruangan instalasi di alamat baru' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  newInstallationRoom?: string | null;

  @ApiPropertyOptional({ description: 'Catatan pemindahan lokasi unit' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
