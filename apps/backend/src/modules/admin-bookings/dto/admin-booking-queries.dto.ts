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
import { BookingAcUnitDto, BookingAddressDto } from '../../bookings/dto/create-guest-booking.dto';

export class AdminCreateManualBookingDto {
  @ApiProperty({ description: 'ID Layanan' })
  @IsNotEmpty({ message: 'ID Layanan wajib dipilih' })
  @IsUUID('4', { message: 'ID Layanan tidak valid' })
  serviceId: string;

  @ApiProperty({ description: 'Daftar unit AC', type: [BookingAcUnitDto] })
  @IsArray({ message: 'Unit AC harus berupa array' })
  @ArrayMinSize(1, { message: 'Minimal 1 unit AC didaftarkan' })
  @ArrayMaxSize(10, { message: 'Maksimal 10 unit AC per pemesanan' })
  @ValidateNested({ each: true })
  @Type(() => BookingAcUnitDto)
  units: BookingAcUnitDto[];

  @ApiProperty({ description: 'ID Wilayah Layanan' })
  @IsNotEmpty({ message: 'Wilayah operasional wajib dipilih' })
  @IsUUID('4', { message: 'ID Wilayah Layanan tidak valid' })
  serviceAreaId: string;

  @ApiProperty({ description: 'Alamat servis', type: BookingAddressDto })
  @ValidateNested()
  @Type(() => BookingAddressDto)
  serviceAddress: BookingAddressDto;

  @ApiProperty({ description: 'Waktu mulai yang dipilih dalam format ISO 8601' })
  @IsNotEmpty({ message: 'Waktu mulai wajib ditentukan' })
  @IsISO8601({}, { message: 'Format waktu mulai harus ISO 8601' })
  selectedStartAt: string;

  @ApiProperty({ description: 'Nama lengkap pelanggan' })
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @IsString()
  @MinLength(2, { message: 'Nama pelanggan minimal 2 karakter' })
  @MaxLength(150)
  customerName: string;

  @ApiProperty({ description: 'Nomor WhatsApp pelanggan' })
  @IsNotEmpty({ message: 'Nomor WhatsApp wajib diisi' })
  @IsString()
  @MinLength(8, { message: 'Nomor WhatsApp minimal 8 digit' })
  @MaxLength(25)
  customerPhone: string;

  @ApiPropertyOptional({ description: 'Email pelanggan' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  customerEmail?: string;

  @ApiPropertyOptional({ description: 'Catatan dari pelanggan' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNotes?: string;

  @ApiPropertyOptional({ description: 'Catatan internal admin' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'ID Teknisi jika langsung ditugaskan' })
  @IsOptional()
  @IsUUID('4', { message: 'ID Teknisi tidak valid' })
  technicianId?: string;

  @ApiPropertyOptional({
    description: 'Status awal booking',
    enum: ['PENDING', 'CONFIRMED', 'ASSIGNED'],
    default: 'CONFIRMED',
  })
  @IsOptional()
  @IsEnum(['PENDING', 'CONFIRMED', 'ASSIGNED'])
  status?: 'PENDING' | 'CONFIRMED' | 'ASSIGNED' = 'CONFIRMED';
}

export class AdminCalendarQueryDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'month' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  view: 'day' | 'week' | 'month' = 'month';

  @ApiProperty({ description: 'Tanggal mulai YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Tanggal mulai wajib diisi' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format startDate harus YYYY-MM-DD' })
  startDate: string;

  @ApiProperty({ description: 'Tanggal akhir YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Tanggal akhir wajib diisi' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format endDate harus YYYY-MM-DD' })
  endDate: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Teknisi' })
  @IsOptional()
  @IsString()
  technicianId?: string;
}

export class TechnicianScheduleQueryDto {
  @ApiProperty({ description: 'Tanggal jadwal YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Tanggal wajib diisi' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Format date harus YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional({ description: 'Filter berdasarkan ID Teknisi' })
  @IsOptional()
  @IsString()
  technicianId?: string;
}
