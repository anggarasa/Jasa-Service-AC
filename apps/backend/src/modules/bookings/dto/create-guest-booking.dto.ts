import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class BookingAcUnitDto {
  @ApiPropertyOptional({ description: 'Merk AC (Daikin, Panasonic, LG, Sharp, dll)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ description: 'Model unit AC' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiProperty({
    description: 'Tipe AC',
    enum: ['SPLIT', 'CASSETTE', 'FLOOR_STANDING', 'CENTRAL', 'WINDOW', 'PORTABLE', 'OTHER'],
    default: 'SPLIT',
  })
  @IsEnum(['SPLIT', 'CASSETTE', 'FLOOR_STANDING', 'CENTRAL', 'WINDOW', 'PORTABLE', 'OTHER'], {
    message: 'Tipe AC tidak valid',
  })
  type: 'SPLIT' | 'CASSETTE' | 'FLOOR_STANDING' | 'CENTRAL' | 'WINDOW' | 'PORTABLE' | 'OTHER' = 'SPLIT';

  @ApiPropertyOptional({ description: 'Kapasitas PK (0.5, 0.75, 1, 1.5, 2, dll)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: 'Kapasitas PK harus berupa angka atau desimal valid' })
  capacityPk?: string;

  @ApiPropertyOptional({ description: 'Ruangan tempat unit terpasang (Ruang Tamu, Kamar Utama, dll)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  installationRoom?: string;

  @ApiPropertyOptional({ description: 'Catatan kondisi atau keluhan pada unit AC' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'ID unit AC yang sudah terdaftar di inventaris (jika ada)' })
  @IsOptional()
  @IsUUID('4')
  acUnitId?: string;
}

export class BookingAddressDto {
  @ApiPropertyOptional({ description: 'Nama penerima di lokasi' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Nomor telepon penerima di lokasi' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  recipientPhone?: string;

  @ApiProperty({ description: 'Alamat lengkap (nama jalan, nomor rumah, RT/RW)' })
  @IsNotEmpty({ message: 'Alamat lengkap wajib diisi' })
  @IsString()
  @MinLength(5, { message: 'Alamat lengkap minimal 5 karakter' })
  @MaxLength(500)
  fullAddress!: string;

  @ApiPropertyOptional({ description: 'Provinsi', default: 'DKI Jakarta' })
  @IsOptional()
  @IsString()
  province: string = 'DKI Jakarta';

  @ApiProperty({ description: 'Kota / Kabupaten' })
  @IsNotEmpty({ message: 'Kota / Kabupaten wajib diisi' })
  @IsString()
  city!: string;

  @ApiProperty({ description: 'Kecamatan' })
  @IsNotEmpty({ message: 'Kecamatan wajib diisi' })
  @IsString()
  district!: string;

  @ApiPropertyOptional({ description: 'Kelurahan / Desa' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subdistrict?: string;

  @ApiPropertyOptional({ description: 'Kode pos (5 digit)' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Patokan lokasi (dekat masjid, seberang ruko, dll)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;
}

export class CreateGuestBookingDto {
  @ApiProperty({ description: 'ID unik layanan AC (UUID)' })
  @IsUUID('4', { message: 'ID Layanan tidak valid' })
  @IsNotEmpty({ message: 'Layanan wajib dipilih' })
  serviceId!: string;

  @ApiProperty({ description: 'Daftar unit AC yang akan diservis', type: [BookingAcUnitDto] })
  @IsArray({ message: 'Daftar unit AC harus berupa array' })
  @ArrayMinSize(1, { message: 'Minimal 1 unit AC harus didaftarkan' })
  @ArrayMaxSize(10, { message: 'Maksimal 10 unit AC per pemesanan' })
  @ValidateNested({ each: true })
  @Type(() => BookingAcUnitDto)
  units!: BookingAcUnitDto[];

  @ApiProperty({ description: 'ID wilayah operasional (UUID)' })
  @IsUUID('4', { message: 'Wilayah jangkauan tidak valid' })
  @IsNotEmpty({ message: 'Wilayah jangkauan wajib dipilih' })
  serviceAreaId!: string;

  @ApiProperty({ description: 'Alamat lokasi pengerjaan', type: BookingAddressDto })
  @ValidateNested()
  @Type(() => BookingAddressDto)
  @IsNotEmpty({ message: 'Alamat pengerjaan wajib diisi' })
  serviceAddress!: BookingAddressDto;

  @ApiProperty({ description: 'Waktu mulai yang dipilih dalam format ISO 8601' })
  @IsISO8601({}, { message: 'Format waktu mulai harus berupa ISO 8601 valid' })
  @IsNotEmpty({ message: 'Waktu mulai wajib dipilih' })
  selectedStartAt!: string;

  @ApiProperty({ description: 'Nama lengkap pemesan' })
  @IsNotEmpty({ message: 'Nama pemesan wajib diisi' })
  @IsString()
  @MinLength(2, { message: 'Nama pemesan minimal 2 karakter' })
  @MaxLength(150)
  customerName!: string;

  @ApiProperty({ description: 'Nomor WhatsApp / telepon pemesan' })
  @IsNotEmpty({ message: 'Nomor kontak wajib diisi' })
  @IsString()
  @MinLength(8, { message: 'Nomor kontak minimal 8 digit' })
  @MaxLength(25)
  customerPhone!: string;

  @ApiPropertyOptional({ description: 'Email pemesan' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Catatan tambahan dari pemesan' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNotes?: string;

  @ApiProperty({ description: 'Kunci idempotensi untuk mencegah submit ganda' })
  @IsNotEmpty({ message: 'Idempotency key wajib disertakan' })
  @IsString()
  @MinLength(16, { message: 'Idempotency key minimal 16 karakter' })
  @MaxLength(128)
  idempotencyKey!: string;
}
