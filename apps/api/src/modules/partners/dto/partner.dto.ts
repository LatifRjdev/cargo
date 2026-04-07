import { IsString, IsOptional, IsEnum, IsUrl, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum PartnerIntegration {
  MANUAL = 'MANUAL',
  WEBHOOK = 'WEBHOOK',
  API = 'API',
}

export class CreatePartnerDto {
  @ApiProperty({ example: 'China Express' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'CHINAEXP' })
  @IsString()
  code: string;

  @ApiProperty({ enum: ['MANUAL', 'WEBHOOK', 'API'], default: 'MANUAL' })
  @IsOptional()
  @IsString()
  integration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingUrlTemplate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiBaseUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePartnerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsEnum(PartnerIntegration) integration?: string;
  @IsOptional() @IsString() trackingUrlTemplate?: string;
  @IsOptional() @IsString() apiBaseUrl?: string;
  @IsOptional() @IsString() webhookUrl?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsEmail() contactEmail?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreatePartnerShipmentDto {
  @ApiProperty()
  @IsString()
  partnerId: string;

  @ApiProperty({ example: 'CE-12345' })
  @IsString()
  partnerTrackingCode: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  boxId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  estimatedDelivery?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShipmentStatusDto {
  @ApiProperty({ example: 'IN_TRANSIT' })
  @IsString()
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateStatusMappingDto {
  @ApiProperty({ example: 'shipped' })
  @IsString()
  partnerStatus: string;

  @ApiProperty({ example: 'IN_TRANSIT' })
  @IsString()
  mappedStatus: string;
}

export class WebhookDto {
  @ApiProperty({ example: 'CE-12345' })
  @IsString()
  trackingCode: string;

  @ApiProperty({ example: 'shipped' })
  @IsString()
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}
