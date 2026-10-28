import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class OperationalReportsQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  technicianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  serviceId?: string;
}

export class ExportReportsQueryDto extends OperationalReportsQueryDto {
  @ApiPropertyOptional({ example: 'invoices', enum: ['invoices', 'payments', 'work-orders', 'overview'] })
  @IsOptional()
  @IsString()
  type?: 'invoices' | 'payments' | 'work-orders' | 'overview' = 'invoices';
}
