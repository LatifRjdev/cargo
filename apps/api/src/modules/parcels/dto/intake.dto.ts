import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IntakeDto {
  @ApiProperty({ example: 'CD-0001', description: 'Customer client code' })
  @IsString()
  clientCode: string;

  @ApiProperty({ enum: ['TAOBAO', 'ALI_1688', 'PINDUODUO', 'POIZON', 'OTHER'] })
  @IsEnum(['TAOBAO', 'ALI_1688', 'PINDUODUO', 'POIZON', 'OTHER'], {
    message: 'marketplace must be one of: TAOBAO, ALI_1688, PINDUODUO, POIZON, OTHER',
  })
  marketplace: string;

  @ApiProperty({ enum: ['CLOTHING', 'ELECTRONICS', 'SHOES', 'COSMETICS', 'FOOD', 'HOUSEHOLD', 'OTHER'] })
  @IsEnum(['CLOTHING', 'ELECTRONICS', 'SHOES', 'COSMETICS', 'FOOD', 'HOUSEHOLD', 'OTHER'], {
    message: 'category must be one of: CLOTHING, ELECTRONICS, SHOES, COSMETICS, FOOD, HOUSEHOLD, OTHER',
  })
  category: string;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  weightKg: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  lengthCm: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  widthCm: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  heightCm: number;

  @ApiPropertyOptional({ example: 'Winter jacket' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDamaged?: boolean;

  @ApiPropertyOptional({ example: 'Corner dented' })
  @IsOptional()
  @IsString()
  damageDescription?: string;

  @ApiPropertyOptional({ example: 'TRK123456' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

export class IntakeUnidentifiedDto {
  @ApiProperty({ enum: ['TAOBAO', 'ALI_1688', 'PINDUODUO', 'POIZON', 'OTHER'] })
  @IsEnum(['TAOBAO', 'ALI_1688', 'PINDUODUO', 'POIZON', 'OTHER'], {
    message: 'marketplace must be one of: TAOBAO, ALI_1688, PINDUODUO, POIZON, OTHER',
  })
  marketplace: string;

  @ApiProperty({ enum: ['CLOTHING', 'ELECTRONICS', 'SHOES', 'COSMETICS', 'FOOD', 'HOUSEHOLD', 'OTHER'] })
  @IsEnum(['CLOTHING', 'ELECTRONICS', 'SHOES', 'COSMETICS', 'FOOD', 'HOUSEHOLD', 'OTHER'], {
    message: 'category must be one of: CLOTHING, ELECTRONICS, SHOES, COSMETICS, FOOD, HOUSEHOLD, OTHER',
  })
  category: string;

  @ApiProperty({ example: 1.5 })
  @IsNumber()
  @Min(0)
  weightKg: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  lengthCm: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  widthCm: number;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  heightCm: number;

  @ApiPropertyOptional({ example: 'Winter jacket' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '+992901234567' })
  @IsOptional()
  @IsString()
  phoneOnLabel?: string;

  @ApiPropertyOptional({ example: 'TRK123456' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}

export class AddTrackingDto {
  @ApiProperty({ example: 'TRK123456', description: 'Marketplace tracking number' })
  @IsString()
  trackingNumber: string;

  @ApiPropertyOptional({ enum: ['TAOBAO', 'ALI_1688', 'PINDUODUO', 'POIZON', 'OTHER'] })
  @IsOptional()
  @IsString()
  marketplace?: string;
}

export class RejectDto {
  @ApiProperty({ example: 'Prohibited item: battery' })
  @IsString()
  reason: string;
}

export class AssignDto {
  @ApiProperty({ example: 'uuid-of-customer' })
  @IsString()
  customerId: string;
}

export class UploadPhotoDto {
  @ApiProperty({ example: 'https://storage.example.com/photo.jpg' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'intake', default: 'intake' })
  @IsOptional()
  @IsString()
  type?: string;
}
