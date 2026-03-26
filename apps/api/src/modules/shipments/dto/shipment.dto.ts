import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ example: 'Guangzhou → Urumqi → Dushanbe' })
  @IsString()
  route: string;

  @ApiPropertyOptional({ example: 'A 123 BC' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiProperty({ type: [String], example: ['uuid1', 'uuid2'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  boxIds: string[];
}

export class AddBoxesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  boxIds: string[];
}

export class UpdateStatusDto {
  @ApiProperty({ enum: ['DEPARTED', 'CUSTOMS', 'ARRIVED', 'COMPLETED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
