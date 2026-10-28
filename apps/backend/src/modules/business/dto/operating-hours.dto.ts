import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class OperatingBreakDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'ID jeda istirahat (opsional)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: '12:00', description: 'Waktu mulai istirahat (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format jam mulai harus HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '13:00', description: 'Waktu selesai istirahat (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format jam selesai harus HH:mm' })
  endTime!: string;
}

export class OperatingHourItemDto {
  @ApiPropertyOptional({ example: 'uuid', description: 'ID jadwal harian (opsional)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 1, description: 'Hari dalam seminggu (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: true, description: 'Apakah buka pada hari ini' })
  @IsBoolean()
  isOpen!: boolean;

  @ApiProperty({ example: '09:00', description: 'Waktu buka operasional (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format jam buka harus HH:mm' })
  openTime!: string;

  @ApiProperty({ example: '17:00', description: 'Waktu tutup operasional (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Format jam tutup harus HH:mm' })
  closeTime!: string;

  @ApiProperty({ type: [OperatingBreakDto], description: 'Daftar jeda istirahat dalam hari kerja' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingBreakDto)
  breaks!: OperatingBreakDto[];
}

export class UpdateOperatingScheduleDto {
  @ApiProperty({ type: [OperatingHourItemDto], description: 'Jadwal 7 hari dalam seminggu (Minggu s/d Sabtu)' })
  @IsArray()
  @ArrayMinSize(7, { message: 'Jadwal harus mencakup 7 hari operasional' })
  @ArrayMaxSize(7, { message: 'Jadwal harus tepat 7 hari operasional' })
  @ValidateNested({ each: true })
  @Type(() => OperatingHourItemDto)
  schedule!: OperatingHourItemDto[];
}
