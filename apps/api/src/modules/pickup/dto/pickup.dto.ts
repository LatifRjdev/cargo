import { IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayDto {
  @ApiProperty({ enum: ['CASH', 'TRANSFER', 'CARD'] })
  @IsEnum(['CASH', 'TRANSFER', 'CARD'])
  method: string;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: ['USD', 'TJS', 'CNY', 'RUB'] })
  @IsEnum(['USD', 'TJS', 'CNY', 'RUB'])
  currency: string;
}
