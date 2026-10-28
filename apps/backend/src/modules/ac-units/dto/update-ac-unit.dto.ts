import { ApiPropertyOptional } from '@nestjs/swagger';
import { AcType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateAcUnitDto {
  @ApiPropertyOptional({ description: 'Label unit AC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unitLabel?: string;

  @ApiPropertyOptional({ description: 'Merk / Brand AC' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  brand?: string;

  @ApiPropertyOptional({ description: 'Model / Tipe seri AC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string | null;

  @ApiPropertyOptional({ description: 'Tipe unit AC', enum: AcType })
  @IsOptional()
  @IsEnum(AcType)
  type?: AcType;

  @ApiPropertyOptional({ description: 'Kapasitas PK' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Kapasitas PK harus berupa angka positif (contoh: 0.5, 0.75, 1, 1.5, 2)',
  })
  capacityPk?: string;

  @ApiPropertyOptional({ description: 'Nomor seri unit AC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string | null;

  @ApiPropertyOptional({ description: 'Ruangan tempat unit terpasang' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  installationRoom?: string | null;

  @ApiPropertyOptional({ description: 'Tanggal pemasangan AC' })
  @IsOptional()
  @IsString()
  installationDate?: string | null;

  @ApiPropertyOptional({ description: 'Catatan teknis khusus AC' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Status aktif unit' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
