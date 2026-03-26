import { IsString, IsEmail, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: ['RU', 'TG'], required: false })
  @IsOptional()
  @IsEnum(['RU', 'TG'])
  language?: 'RU' | 'TG';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  homeWarehouseId?: string;
}
