import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TariffsService } from './tariffs.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Public')
@Controller('public')
export class TariffsController {
  constructor(
    private readonly tariffsService: TariffsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('calculate')
  calculate(@Body() body: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number; originId: string; destinationId: string }) {
    return this.tariffsService.calculate(body);
  }

  @Get('track/:code')
  async track(@Param('code') code: string) {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { boxCode: code },
      include: {
        statusLog: { orderBy: { createdAt: 'asc' } },
        warehouse: { select: { name: true, address: true } },
        batch: {
          select: {
            batchCode: true,
            route: true,
            status: true,
            departedAt: true,
            arrivedAt: true,
          },
        },
      },
    });

    if (!box) {
      throw new NotFoundException('Коробка не найдена');
    }

    return {
      boxCode: box.boxCode,
      status: box.status,
      warehouse: (box as any).warehouse,
      batch: (box as any).batch,
      statusLog: (box as any).statusLog,
      createdAt: box.createdAt,
    };
  }
}
