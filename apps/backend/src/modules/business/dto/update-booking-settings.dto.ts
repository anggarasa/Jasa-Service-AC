import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateBookingSettingsDto {
  @ApiProperty({ example: true, description: 'Apakah pemesanan publik diaktifkan' })
  @IsBoolean()
  bookingEnabled!: boolean;

  @ApiProperty({ example: 30, description: 'Interval slot pemesanan dalam menit' })
  @IsInt()
  @Min(5, { message: 'Interval minimal 5 menit' })
  @Max(180)
  bookingIntervalMinutes!: number;

  @ApiProperty({ example: 15, description: 'Buffer waktu pasca-servis dalam menit' })
  @IsInt()
  @Min(0, { message: 'Buffer servis tidak boleh negatif' })
  @Max(120)
  defaultServiceBufferMinutes!: number;

  @ApiProperty({ example: 30, description: 'Buffer waktu perjalanan teknisi dalam menit' })
  @IsInt()
  @Min(0, { message: 'Buffer perjalanan tidak boleh negatif' })
  @Max(180)
  defaultTravelBufferMinutes!: number;

  @ApiProperty({ example: 120, description: 'Waktu pemesanan paling awal sebelum jadwal (menit)' })
  @IsInt()
  @Min(0, { message: 'Waktu muka minimal tidak boleh negatif' })
  @Max(10080)
  minimumAdvanceMinutes!: number;

  @ApiProperty({ example: 30, description: 'Pemesanan maksimal hari ke depan' })
  @IsInt()
  @Min(1, { message: 'Maksimal advance days minimal 1 hari' })
  @Max(365)
  maximumAdvanceDays!: number;

  @ApiProperty({ example: false, description: 'Konfirmasi otomatis pesanan baru' })
  @IsBoolean()
  autoConfirmBooking!: boolean;

  @ApiProperty({ example: false, description: 'Izinkan pelanggan membatalkan mandiri' })
  @IsBoolean()
  allowCustomerCancellation!: boolean;

  @ApiProperty({ example: 24, description: 'Batas jam sebelum jadwal untuk pembatalan mandiri' })
  @IsInt()
  @Min(0)
  @Max(168)
  cancellationWindowHours!: number;

  @ApiProperty({ example: 5, description: 'Maksimum unit AC yang dapat dipesan per transaksi' })
  @IsInt()
  @Min(1)
  @Max(50)
  maximumUnitsPerBooking!: number;

  @ApiProperty({ example: 'IDR', description: 'Mata uang yang digunakan' })
  @IsString()
  @IsNotEmpty()
  currency!: string;
}
