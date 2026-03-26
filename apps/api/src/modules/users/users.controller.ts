import { Controller, Get, Patch, Body, UseGuards, Res, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('qr')
  getQr(@CurrentUser('id') userId: string) {
    return this.usersService.getQrCode(userId);
  }

  @Get('qr/pdf')
  async getQrPdf(@CurrentUser('id') userId: string, @Res() res: Response) {
    const buffer = await this.usersService.getQrPdf(userId);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="qr-code.png"',
    });
    res.send(buffer);
  }
}
