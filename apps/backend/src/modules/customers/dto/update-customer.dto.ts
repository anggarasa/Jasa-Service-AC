import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({ description: 'Nama lengkap pelanggan', example: 'Budi Santoso' })
  @IsOptional()
  @IsString({ message: 'Nama harus berupa string' })
  @MinLength(2, { message: 'Nama pelanggan minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama pelanggan maksimal 100 karakter' })
  name?: string;

  @ApiPropertyOptional({ description: 'Nomor telepon / WhatsApp', example: '081234567890' })
  @IsOptional()
  @IsString({ message: 'Nomor telepon harus berupa string' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Alamat email pelanggan', example: 'budi@example.com' })
  @IsOptional()
  @IsString({ message: 'Email harus berupa string' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Catatan internal staf admin' })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa string' })
  @MaxLength(1000, { message: 'Catatan maksimal 1000 karakter' })
  notes?: string | null;

  @ApiPropertyOptional({ description: 'Status aktif pelanggan' })
  @IsOptional()
  @IsBoolean({ message: 'isActive harus berupa boolean' })
  isActive?: boolean;
}
