import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BuildBoxDto } from './dto/build-box.dto';
import { PackBoxDto } from './dto/build-box.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BoxesService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
  ) {}

  // ─── 1. Build Box (Consolidation Request) ──────────────────────────────────

  async buildBox(customerId: string, dto: BuildBoxDto) {
    const { parcelIds, customerNote, confirmDamaged } = dto;

    // Fetch all parcels with their warehouse info
    const parcels = await this.prisma.parcel.findMany({
      where: { id: { in: parcelIds } },
      include: { warehouse: true },
    });

    // Validate all parcels exist
    if (parcels.length !== parcelIds.length) {
      const foundIds = parcels.map((p) => p.id);
      const missing = parcelIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(
        `Parcels not found: ${missing.join(', ')}`,
      );
    }

    // Validate all parcels belong to this customer
    const foreignParcels = parcels.filter((p) => p.customerId !== customerId);
    if (foreignParcels.length > 0) {
      throw new ForbiddenException(
        'Some parcels do not belong to this customer',
      );
    }

    // Validate all parcels are in a valid status (STORED or RECEIVED)
    const invalidStatus = parcels.filter(
      (p) => p.status !== 'STORED' && p.status !== 'RECEIVED',
    );
    if (invalidStatus.length > 0) {
      throw new BadRequestException(
        `Parcels must be in STORED or RECEIVED status. Invalid: ${invalidStatus.map((p) => p.id).join(', ')}`,
      );
    }

    // Validate all parcels are in the same warehouse
    const warehouseIds = [...new Set(parcels.map((p) => p.warehouseId))];
    if (warehouseIds.length > 1) {
      throw new BadRequestException(
        'All parcels must be in the same warehouse',
      );
    }
    const warehouseId = warehouseIds[0];

    // Check for damaged parcels without explicit confirmation
    const damagedParcels = parcels.filter((p) => p.isDamaged);
    if (damagedParcels.length > 0 && !confirmDamaged) {
      throw new BadRequestException(
        `Box contains damaged parcels: ${damagedParcels.map((p) => p.id).join(', ')}. Set confirmDamaged=true to proceed.`,
      );
    }

    // Validate total weight <= 50kg (from settings or default)
    const maxWeightSetting = await this.prisma.setting.findUnique({
      where: { key: 'max_box_weight_kg' },
    });
    const maxWeight = maxWeightSetting
      ? parseFloat(maxWeightSetting.value)
      : 50;

    const totalWeight = parcels.reduce(
      (sum, p) => sum + (p.weightKg ? Number(p.weightKg) : 0),
      0,
    );
    if (totalWeight > maxWeight) {
      throw new BadRequestException(
        `Total weight ${totalWeight.toFixed(3)}kg exceeds maximum ${maxWeight}kg`,
      );
    }

    // Find tariff: origin warehouse -> any DESTINATION warehouse
    const tariff = await this.prisma.tariff.findFirst({
      where: {
        originId: warehouseId,
        destination: { type: 'DESTINATION' },
        isActive: true,
      },
    });

    // Calculate estimated price
    let estimatedPrice: Prisma.Decimal | null = null;
    if (tariff && totalWeight > 0) {
      const rate = Number(tariff.ratePerKg);
      const minPrice = Number(tariff.minPrice);
      const calculated = totalWeight * rate;
      estimatedPrice = new Prisma.Decimal(
        Math.max(calculated, minPrice).toFixed(2),
      );
    }

    // Generate box code: BX-YYYYMMDD-XXXX (sequential)
    const boxCode = await this.generateBoxCode();

    // Create everything in a transaction
    const box = await this.prisma.$transaction(async (tx) => {
      // Create the consolidation box
      const createdBox = await tx.consolidationBox.create({
        data: {
          boxCode,
          customerId,
          warehouseId,
          customerNote: customerNote || null,
          status: 'REQUESTED',
          estimatedPrice,
          currency: tariff?.currency ?? 'USD',
        },
        include: {
          parcels: true,
          statusLog: true,
          warehouse: true,
        },
      });

      // Update all parcels: set status IN_BOX and link to box
      await tx.parcel.updateMany({
        where: { id: { in: parcelIds } },
        data: {
          status: 'IN_BOX',
          boxId: createdBox.id,
        },
      });

      // Create parcel status log entries
      await tx.parcelStatusLog.createMany({
        data: parcelIds.map((parcelId) => ({
          parcelId,
          status: 'IN_BOX' as const,
          comment: `Added to box ${boxCode}`,
          changedBy: customerId,
        })),
      });

      // Create box status log entry
      await tx.boxStatusLog.create({
        data: {
          boxId: createdBox.id,
          status: 'REQUESTED',
          comment: 'Consolidation requested by customer',
          changedBy: customerId,
        },
      });

      // Re-fetch with parcels included
      return tx.consolidationBox.findUnique({
        where: { id: createdBox.id },
        include: {
          parcels: true,
          statusLog: true,
          warehouse: true,
        },
      });
    });

    return box;
  }

  // ─── 2. Cancel Box ─────────────────────────────────────────────────────────

  async cancelBox(boxId: string, customerId: string) {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: { parcels: true },
    });

    if (!box) {
      throw new NotFoundException('Box not found');
    }

    if (box.customerId !== customerId) {
      throw new ForbiddenException('Box does not belong to this customer');
    }

    if (box.status !== 'REQUESTED') {
      throw new BadRequestException(
        `Cannot cancel box with status ${box.status}. Only REQUESTED boxes can be cancelled.`,
      );
    }

    const parcelIds = box.parcels.map((p) => p.id);

    return this.prisma.$transaction(async (tx) => {
      // Set box status to CANCELLED
      await tx.consolidationBox.update({
        where: { id: boxId },
        data: { status: 'CANCELLED' },
      });

      // Reset parcels back to STORED, clear boxId
      await tx.parcel.updateMany({
        where: { id: { in: parcelIds } },
        data: {
          status: 'STORED',
          boxId: null,
        },
      });

      // Create parcel status log entries
      if (parcelIds.length > 0) {
        await tx.parcelStatusLog.createMany({
          data: parcelIds.map((parcelId) => ({
            parcelId,
            status: 'STORED' as const,
            comment: `Removed from cancelled box ${box.boxCode}`,
            changedBy: customerId,
          })),
        });
      }

      // Free storage cells if parcels had cells assigned
      const parcelsWithCells = box.parcels.filter((p) => p.cellId);
      if (parcelsWithCells.length > 0) {
        const cellIds = parcelsWithCells.map((p) => p.cellId!);
        await tx.storageCell.updateMany({
          where: { id: { in: cellIds } },
          data: { isOccupied: false },
        });
      }

      // Create box status log entry
      await tx.boxStatusLog.create({
        data: {
          boxId,
          status: 'CANCELLED',
          comment: 'Cancelled by customer',
          changedBy: customerId,
        },
      });

      return tx.consolidationBox.findUnique({
        where: { id: boxId },
        include: { parcels: true, statusLog: true },
      });
    });
  }

  // ─── 3. Find Boxes for Customer (with pagination) ──────────────────────────

  async findForCustomer(
    customerId: string,
    filters: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ConsolidationBoxWhereInput = {
      customerId,
      ...(filters.status ? { status: filters.status as any } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.consolidationBox.findMany({
        where,
        include: {
          parcels: true,
          warehouse: true,
          statusLog: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.consolidationBox.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ─── 4. Get Packing Queue for Warehouse ────────────────────────────────────

  async getPackingQueue(warehouseId: string) {
    return this.prisma.consolidationBox.findMany({
      where: {
        warehouseId,
        status: 'REQUESTED',
      },
      include: {
        parcels: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            clientCode: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── 5. Pack Box (Worker) ──────────────────────────────────────────────────

  async packBox(boxId: string, workerId: string, data: PackBoxDto) {
    const { weightKg, lengthCm, widthCm, heightCm } = data;

    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: {
        parcels: true,
        warehouse: true,
      },
    });

    if (!box) {
      throw new NotFoundException('Box not found');
    }

    if (box.status !== 'REQUESTED' && box.status !== 'PACKING') {
      throw new BadRequestException(
        `Cannot pack box with status ${box.status}. Only REQUESTED or PACKING boxes can be packed.`,
      );
    }

    // Calculate volumetric weight = (L * W * H) / 6000
    const volumetricWeight = (lengthCm * widthCm * heightCm) / 6000;

    // Billable weight = MAX(actual, volumetric)
    const billableWeight = Math.max(weightKg, volumetricWeight);

    // Find tariff for this route
    const tariff = await this.prisma.tariff.findFirst({
      where: {
        originId: box.warehouseId,
        destination: { type: 'DESTINATION' },
        isActive: true,
      },
    });

    // Calculate final price
    let finalPrice: Prisma.Decimal;
    if (tariff) {
      const ratePerKg = Number(tariff.ratePerKg);
      const minPrice = Number(tariff.minPrice);
      const calculated = billableWeight * ratePerKg;
      finalPrice = new Prisma.Decimal(
        Math.max(calculated, minPrice).toFixed(2),
      );
    } else {
      // No tariff found — use estimated price or zero
      finalPrice = box.estimatedPrice ?? new Prisma.Decimal('0.00');
    }

    const updatedBox = await this.prisma.$transaction(async (tx) => {
      // Update box with measurements, weights, price, and status
      const result = await tx.consolidationBox.update({
        where: { id: boxId },
        data: {
          weightKg: new Prisma.Decimal(weightKg.toFixed(3)),
          lengthCm: new Prisma.Decimal(lengthCm.toFixed(2)),
          widthCm: new Prisma.Decimal(widthCm.toFixed(2)),
          heightCm: new Prisma.Decimal(heightCm.toFixed(2)),
          volumetricWeight: new Prisma.Decimal(volumetricWeight.toFixed(3)),
          billableWeight: new Prisma.Decimal(billableWeight.toFixed(3)),
          finalPrice,
          status: 'PACKED',
        },
        include: {
          parcels: true,
          statusLog: true,
          warehouse: true,
        },
      });

      // Create box status log entry
      await tx.boxStatusLog.create({
        data: {
          boxId,
          status: 'PACKED',
          comment: `Packed by worker. Billable weight: ${billableWeight.toFixed(3)}kg, Final price: ${finalPrice}`,
          changedBy: workerId,
        },
      });

      // Free storage cells of parcels in this box
      const cellIds = box.parcels
        .filter((p) => p.cellId)
        .map((p) => p.cellId!);

      if (cellIds.length > 0) {
        await tx.storageCell.updateMany({
          where: { id: { in: cellIds } },
          data: { isOccupied: false },
        });

        // Clear cellId on parcels
        await tx.parcel.updateMany({
          where: { boxId },
          data: { cellId: null },
        });
      }

      return result;
    });

    // Audit log
    this.auditLog.log({
      userId: workerId,
      action: 'pack',
      entityType: 'box',
      entityId: boxId,
      details: {
        boxCode: updatedBox.boxCode,
        weightKg,
        billableWeight,
        finalPrice: finalPrice.toString(),
      },
    }).catch(() => {});

    // Notify customer: box packed
    if (box.customerId) {
      const msg = `Ваша коробка ${updatedBox.boxCode} упакована!\nВес: ${billableWeight.toFixed(2)} кг\nСтоимость: $${finalPrice}`;
      this.notifications.send(box.customerId, 'box_packed', msg).catch(() => {});
    }

    return updatedBox;
  }

  // ─── 6. Find By ID ─────────────────────────────────────────────────────────

  async findById(boxId: string) {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: {
        parcels: {
          include: {
            photos: true,
          },
        },
        statusLog: {
          orderBy: { createdAt: 'desc' },
        },
        payment: true,
        warehouse: true,
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            clientCode: true,
          },
        },
      },
    });

    if (!box) {
      throw new NotFoundException('Box not found');
    }

    return box;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async generateBoxCode(): Promise<string> {
    const today = new Date();
    const dateStr =
      today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    const prefix = `BX-${dateStr}-`;

    // Find the latest box code for today
    const lastBox = await this.prisma.consolidationBox.findFirst({
      where: {
        boxCode: { startsWith: prefix },
      },
      orderBy: { boxCode: 'desc' },
    });

    let sequence = 1;
    if (lastBox) {
      const lastSequence = parseInt(lastBox.boxCode.split('-').pop() || '0', 10);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }
}
