import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'Budi Santoso',
    description: 'Nama lengkap tampilan pengguna',
  })
  @IsString({ message: 'Nama harus berupa string.' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong.' })
  @MinLength(2, { message: 'Nama minimal 2 karakter.' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter.' })
  name!: string;
}
