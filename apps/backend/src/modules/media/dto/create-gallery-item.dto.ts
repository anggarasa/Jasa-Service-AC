import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGalleryItemDto {
  @ApiProperty({ example: 'uuid', description: 'ID MediaAsset yang telah diunggah' })
  @IsString()
  @IsNotEmpty({ message: 'MediaAsset ID wajib diisi' })
  mediaAssetId!: string;

  @ApiPropertyOptional({ example: 'Pembersihan evaporator AC kantor dengan jet pump', description: 'Keterangan/caption foto' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;

  @ApiPropertyOptional({ example: 'Teknisi CoolCare sedang mencuci unit AC indoor', description: 'Teks alternatif aksesibilitas (alt text)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  altText?: string;

  @ApiPropertyOptional({ example: 0, description: 'Urutan tampilan dalam galeri' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ example: true, description: 'Status keaktifan item galeri' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
