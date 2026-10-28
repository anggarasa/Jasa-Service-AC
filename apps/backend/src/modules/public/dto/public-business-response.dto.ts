import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicBusinessResponseDto {
  @ApiProperty({ example: 'CoolCare AC Service' })
  name!: string;

  @ApiProperty({ example: 'coolcare-ac' })
  slug!: string;

  @ApiPropertyOptional({ example: 'Layanan spesialis cuci dan servis AC profesional di Jabodetabek' })
  description?: string | null;

  @ApiProperty({ example: '+62 812-3456-7890' })
  phone!: string;

  @ApiProperty({ example: '6281234567890' })
  whatsappNumber!: string;

  @ApiProperty({ example: 'halo@coolcare.id' })
  email!: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 45' })
  address!: string;

  @ApiProperty({ example: 'Jakarta Selatan' })
  city!: string;

  @ApiProperty({ example: 'DKI Jakarta' })
  province!: string;

  @ApiPropertyOptional({ example: '12160' })
  postalCode?: string | null;

  @ApiPropertyOptional({ example: 'https://maps.google.com/?q=-6.2088,106.8456' })
  googleMapsUrl?: string | null;

  @ApiProperty({ example: 'Asia/Jakarta' })
  timezone!: string;

  @ApiPropertyOptional({ example: 'https://storage.../logo.webp' })
  logoMediaUrl?: string | null;

  @ApiProperty({ example: true })
  isOpenForPublicDisplay!: boolean;
}
