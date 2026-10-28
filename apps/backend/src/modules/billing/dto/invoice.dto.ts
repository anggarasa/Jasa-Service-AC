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

export class CreateDraftInvoiceDto {
  @ApiProperty({ description: 'ID Work Order yang akan diterbitkan fakturnya' })
  @IsNotEmpty()
  @IsUUID('4')
  workOrderId: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTotal?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxTotal?: number;

  @ApiPropertyOptional({ example: 7, description: 'Hari jatuh tempo sejak terbit' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(90)
  dueDays?: number;
}

export class VoidInvoiceDto {
  @ApiProperty({ example: 'Salah input kuantitas material dan dibatalkan pelanggan' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class InvoiceListQueryDto {
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

  @ApiPropertyOptional({ enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
