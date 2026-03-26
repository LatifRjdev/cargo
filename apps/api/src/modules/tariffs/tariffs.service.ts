import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TariffsService {
  constructor(private prisma: PrismaService) {}

  async calculate(input: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number; originId: string; destinationId: string }) {
    const tariff = await this.prisma.tariff.findUnique({
      where: { originId_destinationId: { originId: input.originId, destinationId: input.destinationId } },
    });
    if (!tariff) throw new Error('Tariff not found');

    const volumetricWeight = (input.lengthCm * input.widthCm * input.heightCm) / tariff.volDivisor;
    const billableWeight = Math.max(input.weightKg, volumetricWeight);
    const price = Math.max(billableWeight * Number(tariff.ratePerKg), Number(tariff.minPrice));

    return {
      actualWeight: input.weightKg,
      volumetricWeight: Math.round(volumetricWeight * 1000) / 1000,
      billableWeight: Math.round(billableWeight * 1000) / 1000,
      price: Math.round(price * 100) / 100,
      currency: tariff.currency,
    };
  }
}
