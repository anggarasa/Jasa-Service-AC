import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassphrase123!',
    description: 'Password pengguna saat ini',
  })
  @IsString({ message: 'Password saat ini harus berupa string.' })
  @IsNotEmpty({ message: 'Password saat ini tidak boleh kosong.' })
  currentPassword!: string;

  @ApiProperty({
    example: 'NewSecurePassphrase456!',
    description: 'Password baru pengguna (minimal 12 karakter, maksimal 128 karakter)',
  })
  @IsString({ message: 'Password baru harus berupa string.' })
  @IsNotEmpty({ message: 'Password baru tidak boleh kosong.' })
  @MinLength(12, { message: 'Password baru minimal 12 karakter.' })
  @MaxLength(128, { message: 'Password baru maksimal 128 karakter.' })
  newPassword!: string;
}
