import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({ example: 'CASH', enum: ['CASH', 'BANK_TRANSFER', 'EXTERNAL_QRIS', 'OTHER_MANUAL'] })
  @IsNotEmpty()
  @IsString()
  method: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: '2026-10-28T14:30:00.000Z' })
  @IsOptional()
  @IsString()
  paidAtClaimed?: string;

  @ApiPropertyOptional({ example: 'Pembayaran tunai diterima langsung oleh teknisi di lokasi' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'UUID MediaAsset bukti transfer / tanda terima' })
  @IsOptional()
  @IsUUID('4')
  proofMediaId?: string;

  @ApiPropertyOptional({ description: 'Kunci idempotensi untuk mencegah pembayaran ganda' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class VerifyPaymentDto {
  @ApiPropertyOptional({ example: 'Telah dicocokkan dengan mutasi rekening BCA' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectPaymentDto {
  @ApiProperty({ example: 'Mutasi rekening bank tidak ditemukan pada jam tersebut' })
  @IsNotEmpty()
  @IsString()
  rejectionReason: string;
}

export class PaymentListQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'VOID'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ['CASH', 'BANK_TRANSFER', 'EXTERNAL_QRIS', 'OTHER_MANUAL'] })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
