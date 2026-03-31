import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TariffsService {
  constructor(private prisma: PrismaService) {}

  async calculate(input: { weightKg: number; lengthCm?: number; widthCm?: number; heightCm?: number; originId?: string; destinationId?: string }) {
    if (!input.weightKg || input.weightKg <= 0) {
      throw new BadRequestException('weightKg is required and must be > 0');
    }

    let originId = input.originId;
    let destinationId = input.destinationId;

    // Default: find first active tariff if no origin/destination specified
    if (!originId || !destinationId) {
      const defaultTariff = await this.prisma.tariff.findFirst({
        where: { isActive: true },
        include: {
          origin: { select: { id: true, name: true } },
          destination: { select: { id: true, name: true } },
        },
      });
      if (!defaultTariff) throw new BadRequestException('No tariffs configured');
      originId = defaultTariff.originId;
      destinationId = defaultTariff.destinationId;
    }

    const tariff = await this.prisma.tariff.findUnique({
      where: { originId_destinationId: { originId, destinationId } },
      include: {
        origin: { select: { name: true } },
        destination: { select: { name: true } },
      },
    });
    if (!tariff) throw new BadRequestException('Tariff not found for this route');

    const lengthCm = input.lengthCm || 0;
    const widthCm = input.widthCm || 0;
    const heightCm = input.heightCm || 0;

    const volumetricWeight = (lengthCm > 0 && widthCm > 0 && heightCm > 0)
      ? (lengthCm * widthCm * heightCm) / tariff.volDivisor
      : 0;
    const billableWeight = Math.max(input.weightKg, volumetricWeight);
    const price = Math.max(billableWeight * Number(tariff.ratePerKg), Number(tariff.minPrice));

    return {
      route: `${(tariff as any).origin?.name} → ${(tariff as any).destination?.name}`,
      actualWeight: input.weightKg,
      volumetricWeight: Math.round(volumetricWeight * 1000) / 1000,
      billableWeight: Math.round(billableWeight * 1000) / 1000,
      price: Math.round(price * 100) / 100,
      currency: tariff.currency,
      ratePerKg: Number(tariff.ratePerKg),
      minPrice: Number(tariff.minPrice),
    };
  }
}
