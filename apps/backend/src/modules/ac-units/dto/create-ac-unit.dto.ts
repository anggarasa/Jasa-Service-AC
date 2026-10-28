import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateAcUnitDto {
  @ApiProperty({ description: 'ID Alamat Pelanggan tempat unit dipasang' })
  @IsUUID('4', { message: 'customerAddressId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Alamat instalasi wajib dipilih' })
  customerAddressId: string;

  @ApiProperty({ description: 'Label unit AC', example: 'AC Kamar Utama' })
  @IsString()
  @IsNotEmpty({ message: 'Label unit AC wajib diisi' })
  @MaxLength(100)
  unitLabel: string;

  @ApiProperty({ description: 'Merk / Brand AC', example: 'Daikin' })
  @IsString()
  @IsNotEmpty({ message: 'Merk AC wajib diisi' })
  @MaxLength(50)
  brand: string;

  @ApiPropertyOptional({ description: 'Model / Tipe seri AC', example: 'FTKQ25UVM4' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string | null;

  @ApiPropertyOptional({ description: 'Tipe unit AC', enum: AcType, default: AcType.SPLIT })
  @IsOptional()
  @IsEnum(AcType)
  type?: AcType = AcType.SPLIT;

  @ApiProperty({ description: 'Kapasitas PK (contoh: 0.5, 0.75, 1, 1.5, 2)', example: '1' })
  @IsString()
  @IsNotEmpty({ message: 'Kapasitas PK wajib diisi' })
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Kapasitas PK harus berupa angka positif (contoh: 0.5, 0.75, 1, 1.5, 2)',
  })
  capacityPk: string;

  @ApiPropertyOptional({ description: 'Nomor seri unit AC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string | null;

  @ApiPropertyOptional({ description: 'Ruangan tempat unit terpasang', example: 'Kamar Utama Lantai 2' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  installationRoom?: string | null;

  @ApiPropertyOptional({ description: 'Tanggal pemasangan AC (ISO format)' })
  @IsOptional()
  @IsString()
  installationDate?: string | null;

  @ApiPropertyOptional({ description: 'Catatan teknis khusus AC', example: 'Pipa lewat plafon, butuh tangga 3 meter' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
