import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ enum: ['BOX', 'BATCH', 'GENERAL'] })
  @IsEnum(['BOX', 'BATCH', 'GENERAL'])
  scope: 'BOX' | 'BATCH' | 'GENERAL';

  @ApiProperty({
    enum: [
      'TRANSPORT',
      'CUSTOMS',
      'PACKAGING',
      'LABOR',
      'WAREHOUSE_RENT',
      'INSURANCE',
      'FUEL',
      'OTHER',
    ],
  })
  @IsString()
  category: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150.0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ enum: ['USD', 'CNY', 'TJS', 'RUB'], default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  boxId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}

export class UpdateExpenseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
