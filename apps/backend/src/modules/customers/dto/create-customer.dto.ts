import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Nama lengkap pelanggan', example: 'Budi Santoso' })
  @IsString({ message: 'Nama harus berupa string' })
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @MinLength(2, { message: 'Nama pelanggan minimal 2 karakter' })
  @MaxLength(100, { message: 'Nama pelanggan maksimal 100 karakter' })
  name: string;

  @ApiProperty({ description: 'Nomor telepon / WhatsApp', example: '081234567890' })
  @IsString({ message: 'Nomor telepon harus berupa string' })
  @IsNotEmpty({ message: 'Nomor telepon wajib diisi' })
  phone: string;

  @ApiPropertyOptional({ description: 'Alamat email pelanggan', example: 'budi@example.com' })
  @IsOptional()
  @IsString({ message: 'Email harus berupa string' })
  email?: string | null;

  @ApiPropertyOptional({ description: 'Catatan internal staf admin', example: 'Pelanggan VIP, prefer servis pagi' })
  @IsOptional()
  @IsString({ message: 'Catatan harus berupa string' })
  @MaxLength(1000, { message: 'Catatan maksimal 1000 karakter' })
  notes?: string | null;
}
