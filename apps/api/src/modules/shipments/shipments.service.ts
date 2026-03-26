import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchStatus, BoxStatus } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';

const BATCH_TO_BOX_STATUS: Record<string, BoxStatus> = {
  DEPARTED: BoxStatus.IN_TRANSIT,
  CUSTOMS: BoxStatus.CUSTOMS,
  ARRIVED: BoxStatus.ARRIVED,
};

@Injectable()
export class ShipmentsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
  ) {}

  // ─── Create Shipment ────────────────────────────────────────────────────────

  async create(
    dto: { route: string; vehicleNumber?: string; boxIds: string[] },
    userId: string,
  ) {
    // Validate all boxes exist and are PACKED
    const boxes = await this.prisma.consolidationBox.findMany({
      where: { id: { in: dto.boxIds } },
    });

    if (boxes.length !== dto.boxIds.length) {
      const found = boxes.map((b) => b.id);
      const missing = dto.boxIds.filter((id) => !found.includes(id));
      throw new BadRequestException(`Boxes not found: ${missing.join(', ')}`);
    }

    const notPacked = boxes.filter((b) => b.status !== 'PACKED');
    if (notPacked.length > 0) {
      throw new BadRequestException(
        `Boxes must be in PACKED status: ${notPacked.map((b) => b.boxCode).join(', ')}`,
      );
    }

    const alreadyInBatch = boxes.filter((b) => b.batchId);
    if (alreadyInBatch.length > 0) {
      throw new BadRequestException(
        `Boxes already in a batch: ${alreadyInBatch.map((b) => b.boxCode).join(', ')}`,
      );
    }

    const totalWeight = boxes.reduce(
      (sum, b) => sum + (b.billableWeight ? Number(b.billableWeight) : 0),
      0,
    );

    const batchCode = await this.generateBatchCode();

    const batch = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipmentBatch.create({
        data: {
          batchCode,
          route: dto.route,
          vehicleNumber: dto.vehicleNumber,
          totalBoxes: dto.boxIds.length,
          totalWeight,
          status: BatchStatus.FORMING,
        },
      });

      // Link boxes to batch
      await tx.consolidationBox.updateMany({
        where: { id: { in: dto.boxIds } },
        data: { batchId: created.id },
      });

      await tx.batchStatusLog.create({
        data: {
          batchId: created.id,
          status: BatchStatus.FORMING,
          comment: `Batch created with ${dto.boxIds.length} boxes`,
          changedBy: userId,
        },
      });

      return tx.shipmentBatch.findUnique({
        where: { id: created.id },
        include: {
          boxes: { include: { customer: { select: { id: true, fullName: true, clientCode: true } } } },
          statusLog: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    this.auditLog.log({
      userId,
      action: 'create_shipment',
      entityType: 'batch',
      entityId: batch!.id,
      details: { batchCode, route: dto.route, boxCount: dto.boxIds.length },
    }).catch(() => {});

    return batch;
  }

  // ─── Add Boxes to Existing Batch ──────────────────────────────────────────

  async addBoxes(batchId: string, boxIds: string[], userId: string) {
    const batch = await this.prisma.shipmentBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) throw new NotFoundException('Batch not found');

    if (batch.status !== 'FORMING') {
      throw new BadRequestException(
        `Cannot add boxes to batch with status ${batch.status}`,
      );
    }

    const boxes = await this.prisma.consolidationBox.findMany({
      where: { id: { in: boxIds } },
    });

    if (boxes.length !== boxIds.length) {
      throw new BadRequestException('Some boxes not found');
    }

    const notPacked = boxes.filter((b) => b.status !== 'PACKED');
    if (notPacked.length > 0) {
      throw new BadRequestException(
        `Boxes must be PACKED: ${notPacked.map((b) => b.boxCode).join(', ')}`,
      );
    }

    const alreadyInBatch = boxes.filter((b) => b.batchId);
    if (alreadyInBatch.length > 0) {
      throw new BadRequestException(
        `Already in batch: ${alreadyInBatch.map((b) => b.boxCode).join(', ')}`,
      );
    }

    const addedWeight = boxes.reduce(
      (sum, b) => sum + (b.billableWeight ? Number(b.billableWeight) : 0),
      0,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.consolidationBox.updateMany({
        where: { id: { in: boxIds } },
        data: { batchId },
      });

      await tx.shipmentBatch.update({
        where: { id: batchId },
        data: {
          totalBoxes: { increment: boxIds.length },
          totalWeight: {
            increment: addedWeight,
          },
        },
      });
    });

    return this.findById(batchId);
  }

  // ─── Update Status ────────────────────────────────────────────────────────

  async updateStatus(
    batchId: string,
    newStatus: string,
    comment: string | undefined,
    userId: string,
  ) {
    const batch = await this.prisma.shipmentBatch.findUnique({
      where: { id: batchId },
      include: {
        boxes: {
          include: { customer: { select: { id: true, fullName: true, telegramChatId: true } } },
        },
      },
    });

    if (!batch) throw new NotFoundException('Batch not found');

    const validTransitions: Record<string, string[]> = {
      FORMING: ['DEPARTED'],
      DEPARTED: ['CUSTOMS', 'ARRIVED'],
      CUSTOMS: ['ARRIVED'],
      ARRIVED: ['COMPLETED'],
    };

    const allowed = validTransitions[batch.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${batch.status} to ${newStatus}. Allowed: ${allowed.join(', ')}`,
      );
    }

    const boxStatus = BATCH_TO_BOX_STATUS[newStatus];

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.shipmentBatch.update({
        where: { id: batchId },
        data: {
          status: newStatus as BatchStatus,
          ...(newStatus === 'DEPARTED' ? { departedAt: new Date() } : {}),
          ...(newStatus === 'ARRIVED' ? { arrivedAt: new Date() } : {}),
        },
      });

      await tx.batchStatusLog.create({
        data: {
          batchId,
          status: newStatus as BatchStatus,
          comment,
          changedBy: userId,
        },
      });

      // Auto-update box statuses
      if (boxStatus) {
        const boxIds = batch.boxes.map((b) => b.id);
        await tx.consolidationBox.updateMany({
          where: { id: { in: boxIds } },
          data: { status: boxStatus },
        });

        // Box status log entries
        await tx.boxStatusLog.createMany({
          data: boxIds.map((boxId) => ({
            boxId,
            status: boxStatus,
            comment: `Batch ${batch.batchCode} → ${newStatus}`,
            changedBy: userId,
          })),
        });
      }

      // If COMPLETED, mark boxes as READY for pickup
      if (newStatus === 'COMPLETED') {
        const boxIds = batch.boxes.map((b) => b.id);
        await tx.consolidationBox.updateMany({
          where: { id: { in: boxIds } },
          data: { status: BoxStatus.READY },
        });

        await tx.boxStatusLog.createMany({
          data: boxIds.map((boxId) => ({
            boxId,
            status: BoxStatus.READY,
            comment: `Ready for pickup — batch ${batch.batchCode} completed`,
            changedBy: userId,
          })),
        });
      }

      return result;
    });

    // Audit
    this.auditLog.log({
      userId,
      action: `shipment_${newStatus.toLowerCase()}`,
      entityType: 'batch',
      entityId: batchId,
      details: { batchCode: batch.batchCode, newStatus, boxCount: batch.boxes.length },
    }).catch(() => {});

    // Notify customers
    const eventMap: Record<string, string> = {
      DEPARTED: 'box_shipped',
      CUSTOMS: 'box_customs',
      ARRIVED: 'box_arrived',
      COMPLETED: 'box_ready',
    };
    const msgMap: Record<string, string> = {
      DEPARTED: `Ваша коробка отправлена! Маршрут: ${batch.route}`,
      CUSTOMS: 'Ваша коробка проходит таможню.',
      ARRIVED: 'Ваша коробка прибыла на склад назначения!',
      COMPLETED: 'Ваша коробка готова к выдаче! Приходите на склад.',
    };

    const event = eventMap[newStatus];
    const msg = msgMap[newStatus];
    if (event && msg) {
      const uniqueCustomers = new Map<string, string>();
      for (const box of batch.boxes) {
        if (box.customerId && !uniqueCustomers.has(box.customerId)) {
          uniqueCustomers.set(box.customerId, `${msg}\nКоробка: ${box.boxCode}`);
        }
      }
      for (const [customerId, text] of uniqueCustomers) {
        this.notifications.send(customerId, event, text).catch(() => {});
      }
    }

    return this.findById(batchId);
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  async findAll(filters: { status?: string; page?: number; limit?: number }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status as BatchStatus;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.shipmentBatch.findMany({
        where,
        include: {
          boxes: {
            include: {
              customer: { select: { id: true, fullName: true, clientCode: true } },
            },
          },
          statusLog: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.shipmentBatch.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ─── Find by ID ───────────────────────────────────────────────────────────

  async findById(batchId: string) {
    const batch = await this.prisma.shipmentBatch.findUnique({
      where: { id: batchId },
      include: {
        boxes: {
          include: {
            customer: { select: { id: true, fullName: true, clientCode: true, phone: true } },
            parcels: true,
          },
        },
        statusLog: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  // ─── Available Boxes (PACKED, not in any batch) ────────────────────────────

  async findAvailableBoxes() {
    return this.prisma.consolidationBox.findMany({
      where: {
        status: 'PACKED',
        batchId: null,
      },
      include: {
        customer: { select: { id: true, fullName: true, clientCode: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async generateBatchCode(): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `SH-${dateStr}-`;

    const last = await this.prisma.shipmentBatch.findFirst({
      where: { batchCode: { startsWith: prefix } },
      orderBy: { batchCode: 'desc' },
    });

    let seq = 1;
    if (last) {
      seq = parseInt(last.batchCode.split('-').pop() || '0', 10) + 1;
    }

    return `${prefix}${seq.toString().padStart(4, '0')}`;
  }
}
