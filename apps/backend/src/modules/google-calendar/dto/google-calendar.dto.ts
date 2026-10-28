import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum ResolveConflictActionEnum {
  RESTORE_LOCAL = 'RESTORE_LOCAL',
  ACCEPT_REMOTE = 'ACCEPT_REMOTE',
  IGNORE = 'IGNORE',
}

export class SelectCalendarDto {
  @ApiProperty({ description: 'ID kalender Google yang dipilih untuk sinkronisasi' })
  @IsNotEmpty({ message: 'ID Kalender wajib dipilih' })
  @IsString({ message: 'ID Kalender harus berupa teks' })
  calendarId: string;
}

export class ResolveConflictDto {
  @ApiProperty({
    enum: ResolveConflictActionEnum,
    description: 'Tindakan resolusi konflik (RESTORE_LOCAL, ACCEPT_REMOTE, IGNORE)',
  })
  @IsNotEmpty({ message: 'Tindakan resolusi wajib dipilih' })
  @IsEnum(ResolveConflictActionEnum, { message: 'Tindakan resolusi tidak valid' })
  action: ResolveConflictActionEnum;

  @ApiPropertyOptional({ description: 'Catatan tambahan alasan resolusi' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNotes?: string;
}

export class SyncJobsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter status pekerjaan: PENDING, PROCESSING, COMPLETED, FAILED_RETRY, FAILED_PERMANENT' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ConflictsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter status konflik: OPEN, RESOLVED, IGNORED' })
  @IsOptional()
  @IsString()
  status?: string;
}
