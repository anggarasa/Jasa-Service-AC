import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsUUID, Matches, Max, Min } from 'class-validator';

export class PublicAvailabilityQueryDto {
  @ApiProperty({ description: 'ID unik layanan AC (UUID)' })
  @IsUUID('4', { message: 'ID Layanan tidak valid' })
  @IsNotEmpty({ message: 'ID Layanan wajib diisi' })
  serviceId!: string;

  @ApiProperty({ description: 'Jumlah unit AC yang akan diservis (1-10)', default: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Jumlah unit harus berupa bilangan bulat' })
  @Min(1, { message: 'Jumlah unit minimal 1' })
  @Max(10, { message: 'Jumlah unit maksimal 10' })
  unitCount: number = 1;

  @ApiProperty({ description: 'ID wilayah operasional (UUID)' })
  @IsUUID('4', { message: 'ID Wilayah Layanan tidak valid' })
  @IsNotEmpty({ message: 'ID Wilayah Layanan wajib diisi' })
  serviceAreaId!: string;

  @ApiProperty({ description: 'Tanggal yang diinginkan (YYYY-MM-DD)', example: '2026-11-01' })
  @IsNotEmpty({ message: 'Tanggal wajib diisi' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format tanggal harus YYYY-MM-DD' })
  date!: string;
}
