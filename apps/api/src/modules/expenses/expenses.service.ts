import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseDto, createdById: string) {
    return this.prisma.expense.create({
      data: {
        scope: dto.scope as any,
        category: dto.category as any,
        description: dto.description,
        amount: dto.amount,
        currency: (dto.currency as any) ?? 'USD',
        boxId: dto.boxId,
        batchId: dto.batchId,
        periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
        periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
        createdById,
      },
    });
  }

  async findAll(filters?: {
    scope?: string;
    category?: string;
    boxId?: string;
    batchId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const where: any = {};

    if (filters?.scope) where.scope = filters.scope;
    if (filters?.category) where.category = filters.category;
    if (filters?.boxId) where.boxId = filters.boxId;
    if (filters?.batchId) where.batchId = filters.batchId;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: {
          box: { select: { id: true, boxCode: true } },
          batch: { select: { id: true, batchCode: true } },
          createdBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        box: { select: { id: true, boxCode: true } },
        batch: { select: { id: true, batchCode: true } },
        createdBy: { select: { id: true, fullName: true } },
      },
    });
    if (!expense) throw new NotFoundException('Расход не найден');
    return expense;
  }

  async update(id: string, dto: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.category !== undefined && { category: dto.category as any }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  /**
   * Net profit for a single box
   */
  async getBoxProfit(boxId: string) {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: {
        expenses: true,
        batch: {
          include: {
            expenses: true,
            _count: { select: { boxes: true } },
          },
        },
      },
    });
    if (!box) throw new NotFoundException('Коробка не найдена');

    const revenue = Number(box.finalPrice ?? 0);
    const directExpenses = box.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    let batchExpenseShare = 0;
    if (box.batch) {
      const batchTotal = box.batch.expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      );
      const boxCount = box.batch._count.boxes || 1;
      batchExpenseShare = batchTotal / boxCount;
    }

    const totalExpenses = directExpenses + batchExpenseShare;
    const netProfit = revenue - totalExpenses;
    const marginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      boxId: box.id,
      boxCode: box.boxCode,
      revenue: Math.round(revenue * 100) / 100,
      directExpenses: Math.round(directExpenses * 100) / 100,
      batchExpenseShare: Math.round(batchExpenseShare * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      marginPct: Math.round(marginPct * 100) / 100,
      currency: box.currency,
    };
  }

  /**
   * Profit summary for all delivered boxes in a period
   */
  async getProfitSummary(from?: string, to?: string) {
    const where: any = { status: 'DELIVERED' };
    if (from || to) {
      where.updatedAt = {};
      if (from) where.updatedAt.gte = new Date(from);
      if (to) where.updatedAt.lte = new Date(to);
    }

    const boxes = await this.prisma.consolidationBox.findMany({
      where,
      include: {
        expenses: true,
        batch: {
          include: {
            expenses: true,
            _count: { select: { boxes: true } },
          },
        },
      },
    });

    // General expenses in period
    const generalWhere: any = { scope: 'GENERAL' };
    if (from || to) {
      generalWhere.createdAt = {};
      if (from) generalWhere.createdAt.gte = new Date(from);
      if (to) generalWhere.createdAt.lte = new Date(to);
    }
    const generalExpenses = await this.prisma.expense.findMany({
      where: generalWhere,
    });
    const totalGeneralExpenses = generalExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    let totalRevenue = 0;
    let totalDirectExpenses = 0;
    let totalBatchExpenses = 0;
    const boxProfits = [];

    for (const box of boxes) {
      const revenue = Number(box.finalPrice ?? 0);
      const direct = box.expenses.reduce(
        (sum, e) => sum + Number(e.amount),
        0,
      );

      let batchShare = 0;
      if (box.batch) {
        const batchTotal = box.batch.expenses.reduce(
          (sum, e) => sum + Number(e.amount),
          0,
        );
        const boxCount = box.batch._count.boxes || 1;
        batchShare = batchTotal / boxCount;
      }

      totalRevenue += revenue;
      totalDirectExpenses += direct;
      totalBatchExpenses += batchShare;

      const total = direct + batchShare;
      const net = revenue - total;
      boxProfits.push({
        boxId: box.id,
        boxCode: box.boxCode,
        revenue: Math.round(revenue * 100) / 100,
        directExpenses: Math.round(direct * 100) / 100,
        batchExpenseShare: Math.round(batchShare * 100) / 100,
        totalExpenses: Math.round(total * 100) / 100,
        netProfit: Math.round(net * 100) / 100,
        marginPct: revenue > 0 ? Math.round(((net / revenue) * 100) * 100) / 100 : 0,
        currency: box.currency,
      });
    }

    const totalExpenses = totalDirectExpenses + totalBatchExpenses + totalGeneralExpenses;
    const netProfit = totalRevenue - totalExpenses;

    return {
      period: { from: from ?? null, to: to ?? null },
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalDirectExpenses: Math.round(totalDirectExpenses * 100) / 100,
      totalBatchExpenses: Math.round(totalBatchExpenses * 100) / 100,
      totalGeneralExpenses: Math.round(totalGeneralExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      marginPct:
        totalRevenue > 0
          ? Math.round(((netProfit / totalRevenue) * 100) * 100) / 100
          : 0,
      currency: 'USD',
      boxCount: boxes.length,
      boxes: boxProfits,
    };
  }
}
