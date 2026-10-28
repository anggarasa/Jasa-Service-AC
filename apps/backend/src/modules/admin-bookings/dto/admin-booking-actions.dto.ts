import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AdminConfirmBookingDto {
  @ApiPropertyOptional({ description: 'ID Teknisi jika ingin langsung ditugaskan saat konfirmasi' })
  @IsOptional()
  @IsUUID('4', { message: 'ID Teknisi tidak valid' })
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Catatan internal admin' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  internalNotes?: string;
}

export class AdminRejectBookingDto {
  @ApiProperty({ description: 'Alasan penolakan pemesanan' })
  @IsNotEmpty({ message: 'Alasan penolakan wajib diisi' })
  @IsString()
  @MinLength(3, { message: 'Alasan penolakan minimal 3 karakter' })
  @MaxLength(500, { message: 'Alasan penolakan maksimal 500 karakter' })
  reason: string;
}

export class AdminAssignTechnicianDto {
  @ApiProperty({ description: 'ID Teknisi yang ditugaskan' })
  @IsNotEmpty({ message: 'ID Teknisi wajib diisi' })
  @IsUUID('4', { message: 'ID Teknisi tidak valid' })
  technicianId: string;

  @ApiPropertyOptional({ description: 'Instruksi atau catatan untuk teknisi' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class AdminReassignTechnicianDto {
  @ApiProperty({ description: 'ID Teknisi pengganti' })
  @IsNotEmpty({ message: 'ID Teknisi pengganti wajib diisi' })
  @IsUUID('4', { message: 'ID Teknisi pengganti tidak valid' })
  technicianId: string;

  @ApiProperty({ description: 'Alasan pengalihan teknisi' })
  @IsNotEmpty({ message: 'Alasan pengalihan wajib diisi' })
  @IsString()
  @MinLength(3, { message: 'Alasan pengalihan minimal 3 karakter' })
  @MaxLength(500, { message: 'Alasan pengalihan maksimal 500 karakter' })
  reason: string;
}

export class AdminRescheduleBookingDto {
  @ApiProperty({ description: 'Jadwal baru dalam format ISO 8601' })
  @IsNotEmpty({ message: 'Jadwal baru wajib diisi' })
  @IsISO8601({}, { message: 'Jadwal baru harus dalam format ISO 8601' })
  newStartAt: string;

  @ApiPropertyOptional({ description: 'ID Teknisi pilihan (jika ingin dialihkan/dipilih spesifik)' })
  @IsOptional()
  @IsUUID('4', { message: 'ID Teknisi tidak valid' })
  technicianId?: string;

  @ApiProperty({ description: 'Alasan penjadwalan ulang' })
  @IsNotEmpty({ message: 'Alasan penjadwalan ulang wajib diisi' })
  @IsString()
  @MinLength(3, { message: 'Alasan penjadwalan ulang minimal 3 karakter' })
  @MaxLength(500, { message: 'Alasan penjadwalan ulang maksimal 500 karakter' })
  reason: string;
}

export class AdminCancelBookingDto {
  @ApiProperty({ description: 'Alasan pembatalan pemesanan' })
  @IsNotEmpty({ message: 'Alasan pembatalan wajib diisi' })
  @IsString()
  @MinLength(3, { message: 'Alasan pembatalan minimal 3 karakter' })
  @MaxLength(500, { message: 'Alasan pembatalan maksimal 500 karakter' })
  reason: string;
}

export class AdminUpdateInternalNotesDto {
  @ApiProperty({ description: 'Catatan internal admin' })
  @IsNotEmpty({ message: 'Catatan internal wajib diisi' })
  @IsString()
  @MaxLength(2000, { message: 'Catatan internal maksimal 2000 karakter' })
  internalNotes: string;
}
