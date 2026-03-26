import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '+992901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Иван Иванов', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+992901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  code: string;
}

export class LoginDto {
  @ApiProperty({ example: '+992901234567' })
  @IsString()
  phone: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class TelegramLinkDto {
  @ApiProperty()
  @IsString()
  telegramChatId: string;
}
