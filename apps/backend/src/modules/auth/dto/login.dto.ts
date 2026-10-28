import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'owner@coolcare.id',
    description: 'Email pengguna yang terdaftar',
  })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong.' })
  email!: string;

  @ApiProperty({
    example: 'SecurePassphrase123!',
    description: 'Password pengguna (minimal 8 karakter)',
  })
  @IsString({ message: 'Password harus berupa string.' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong.' })
  @MinLength(8, { message: 'Password minimal 8 karakter.' })
  password!: string;
}
