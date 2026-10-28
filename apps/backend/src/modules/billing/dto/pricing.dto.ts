import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class WorkOrderChargeInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  workOrderItemId?: string;

  @ApiProperty({ example: 'ADDITIONAL_LABOR' })
  @IsString()
  lineType: string;

  @ApiProperty({ example: 'Biaya bongkar pasang pipa tinggi' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 75000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ default: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class WorkOrderMaterialInputDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  workOrderItemId?: string;

  @ApiProperty({ example: 'Freon R32' })
  @IsString()
  materialName: string;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 120000 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SaveWorkOrderPricingDto {
  @ApiProperty({ type: [WorkOrderChargeInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderChargeInputDto)
  charges: WorkOrderChargeInputDto[];

  @ApiProperty({ type: [WorkOrderMaterialInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkOrderMaterialInputDto)
  materials: WorkOrderMaterialInputDto[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTotal?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRatePercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateChargeApprovalDto {
  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  proposedTotal: number;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedTotal?: number;

  @ApiProperty({ example: 'VERBAL_PHONE', enum: ['VERBAL_PHONE', 'IN_PERSON', 'WHATSAPP_CHAT', 'SIGNATURE_WRITTEN'] })
  @IsString()
  approvalMethod: string;

  @ApiProperty({ example: 'Bpk. Hendra' })
  @IsString()
  approvedByName: string;

  @ApiPropertyOptional({ example: '+628123456789' })
  @IsOptional()
  @IsString()
  approvedByContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  approvalEvidenceMediaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  internalNotes?: string;
}
