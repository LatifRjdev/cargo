import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Currency, Prisma } from '@prisma/client';

@Injectable()
export class ExchangeRatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.exchangeRate.findMany({
      orderBy: [{ fromCurrency: 'asc' }, { toCurrency: 'asc' }],
    });
  }

  async upsert(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    updatedBy?: string,
  ) {
    return this.prisma.exchangeRate.upsert({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: fromCurrency as Currency,
          toCurrency: toCurrency as Currency,
        },
      },
      update: {
        rate: new Prisma.Decimal(rate.toFixed(6)),
        updatedBy,
      },
      create: {
        fromCurrency: fromCurrency as Currency,
        toCurrency: toCurrency as Currency,
        rate: new Prisma.Decimal(rate.toFixed(6)),
        updatedBy,
      },
    });
  }

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;

    const rate = await this.prisma.exchangeRate.findUnique({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: from as Currency,
          toCurrency: to as Currency,
        },
      },
    });

    if (!rate) {
      throw new NotFoundException(`Exchange rate ${from} → ${to} not found`);
    }

    return amount * Number(rate.rate);
  }
}
