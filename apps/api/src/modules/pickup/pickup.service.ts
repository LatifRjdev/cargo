import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoxStatus, PaymentMethod, PaymentStatus, Currency } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PickupService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
  ) {}

  // ─── Pending pickups (boxes with READY status) ────────────────────────────

  async findPending() {
    return this.prisma.consolidationBox.findMany({
      where: { status: BoxStatus.READY },
      include: {
        customer: { select: { id: true, fullName: true, clientCode: true, phone: true } },
        warehouse: { select: { name: true } },
        payment: true,
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  // ─── Search by code or client ─────────────────────────────────────────────

  async search(query: string) {
    return this.prisma.consolidationBox.findMany({
      where: {
        OR: [
          { boxCode: { contains: query, mode: 'insensitive' } },
          { customer: { clientCode: { contains: query, mode: 'insensitive' } } },
          { customer: { fullName: { contains: query, mode: 'insensitive' } } },
          { customer: { phone: { contains: query } } },
        ],
        status: { in: [BoxStatus.READY, BoxStatus.ARRIVED] },
      },
      include: {
        customer: { select: { id: true, fullName: true, clientCode: true, phone: true } },
        payment: true,
      },
      take: 20,
    });
  }

  // ─── Pay for a box ────────────────────────────────────────────────────────

  async pay(
    boxId: string,
    dto: { method: string; amount: number; currency: string },
    workerId: string,
  ) {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: { payment: true },
    });

    if (!box) throw new NotFoundException('Box not found');

    if (box.payment) {
      throw new BadRequestException('Box already paid');
    }

    if (box.status !== 'READY' && box.status !== 'ARRIVED') {
      throw new BadRequestException(
        `Cannot pay for box with status ${box.status}`,
      );
    }

    // Look up exchange rate if currency differs
    let exchangeRate: number | null = null;
    if (dto.currency !== box.currency) {
      const rate = await this.prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: dto.currency as Currency,
          toCurrency: box.currency,
        },
        orderBy: { updatedAt: 'desc' },
      });
      if (rate) exchangeRate = Number(rate.rate);
    }

    const payment = await this.prisma.payment.create({
      data: {
        boxId,
        customerId: box.customerId,
        method: dto.method as PaymentMethod,
        amount: new Prisma.Decimal(dto.amount.toFixed(2)),
        currency: dto.currency as Currency,
        exchangeRate: exchangeRate ? new Prisma.Decimal(exchangeRate.toFixed(6)) : null,
        status: PaymentStatus.COMPLETED,
        collectedById: workerId,
        paidAt: new Date(),
      },
    });

    this.auditLog.log({
      userId: workerId,
      action: 'payment',
      entityType: 'box',
      entityId: boxId,
      details: { method: dto.method, amount: dto.amount, currency: dto.currency },
    }).catch(() => {});

    return payment;
  }

  // ─── Deliver (mark as delivered) ──────────────────────────────────────────

  async deliver(boxId: string, workerId: string) {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: { payment: true, customer: true },
    });

    if (!box) throw new NotFoundException('Box not found');

    if (!box.payment) {
      throw new BadRequestException('Box must be paid before delivery');
    }

    if (box.status !== 'READY' && box.status !== 'ARRIVED') {
      throw new BadRequestException(
        `Cannot deliver box with status ${box.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.consolidationBox.update({
        where: { id: boxId },
        data: { status: BoxStatus.DELIVERED },
      });

      await tx.boxStatusLog.create({
        data: {
          boxId,
          status: BoxStatus.DELIVERED,
          comment: 'Delivered to customer',
          changedBy: workerId,
        },
      });

      return result;
    });

    this.auditLog.log({
      userId: workerId,
      action: 'deliver',
      entityType: 'box',
      entityId: boxId,
      details: { boxCode: box.boxCode },
    }).catch(() => {});

    // Notify customer
    if (box.customerId) {
      this.notifications.send(
        box.customerId,
        'box_delivered',
        `Ваша коробка ${box.boxCode} выдана. Спасибо!`,
      ).catch(() => {});
    }

    return updated;
  }
}
