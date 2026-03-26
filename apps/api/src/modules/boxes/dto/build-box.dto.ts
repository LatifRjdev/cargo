import {
  IsArray,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BuildBoxDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'Array of parcel IDs to consolidate',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  parcelIds: string[];

  @ApiProperty({ required: false, example: 'Handle with care' })
  @IsOptional()
  @IsString()
  customerNote?: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Confirm inclusion of damaged parcels',
  })
  @IsOptional()
  @IsBoolean()
  confirmDamaged?: boolean;
}

export class PackBoxDto {
  @ApiProperty({ example: 3.5, description: 'Actual weight in kg' })
  @IsNumber()
  @Min(0.001)
  weightKg: number;

  @ApiProperty({ example: 40, description: 'Length in cm' })
  @IsNumber()
  @Min(0.1)
  lengthCm: number;

  @ApiProperty({ example: 30, description: 'Width in cm' })
  @IsNumber()
  @Min(0.1)
  widthCm: number;

  @ApiProperty({ example: 25, description: 'Height in cm' })
  @IsNumber()
  @Min(0.1)
  heightCm: number;
}
