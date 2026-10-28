import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateAreaDto {
  @ApiProperty({ description: 'Kota / Kabupaten', example: 'Jakarta Selatan' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Kecamatan', example: 'Kebayoran Baru' })
  @IsString()
  @IsNotEmpty()
  district: string;
}
