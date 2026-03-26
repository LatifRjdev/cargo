import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WarehousesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.warehouse.findMany({ where: { isActive: true } });
  }

  // ─── Storage Cells ────────────────────────────────────────────────────────

  async findCells(warehouseId: string) {
    return this.prisma.storageCell.findMany({
      where: { warehouseId },
      include: {
        parcels: {
          where: { cellId: { not: null } },
          select: { id: true, trackingNumber: true, status: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async createCell(warehouseId: string, code: string) {
    const existing = await this.prisma.storageCell.findUnique({
      where: { warehouseId_code: { warehouseId, code } },
    });
    if (existing) {
      throw new BadRequestException(`Cell ${code} already exists`);
    }
    return this.prisma.storageCell.create({
      data: { warehouseId, code },
    });
  }

  async createCellsBatch(warehouseId: string, prefix: string, count: number) {
    const cells = [];
    for (let i = 1; i <= count; i++) {
      const code = `${prefix}-${i.toString().padStart(3, '0')}`;
      cells.push({ warehouseId, code });
    }
    await this.prisma.storageCell.createMany({
      data: cells,
      skipDuplicates: true,
    });
    return this.findCells(warehouseId);
  }

  async deleteCell(cellId: string) {
    const cell = await this.prisma.storageCell.findUnique({
      where: { id: cellId },
    });
    if (!cell) throw new NotFoundException('Cell not found');
    if (cell.isOccupied) {
      throw new BadRequestException('Cannot delete occupied cell');
    }
    return this.prisma.storageCell.delete({ where: { id: cellId } });
  }

  // ─── Inventory (all parcels in warehouse) ─────────────────────────────────

  async inventory(
    warehouseId: string,
    filters: { status?: string; page?: number; limit?: number },
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = { warehouseId };
    if (filters.status) where.status = filters.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.parcel.findMany({
        where,
        include: {
          cell: true,
          customer: { select: { id: true, fullName: true, clientCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.parcel.count({ where }),
    ]);

    // Stats
    const stats = await this.prisma.parcel.groupBy({
      by: ['status'],
      where: { warehouseId },
      _count: true,
    });

    const totalWeight = await this.prisma.parcel.aggregate({
      where: { warehouseId, status: { in: ['RECEIVED', 'STORED'] } },
      _sum: { weightKg: true },
    });

    const cellStats = await this.prisma.storageCell.aggregate({
      where: { warehouseId },
      _count: true,
    });

    const occupiedCells = await this.prisma.storageCell.count({
      where: { warehouseId, isOccupied: true },
    });

    return {
      items,
      total,
      page,
      limit,
      stats: stats.map((s) => ({ status: s.status, count: s._count })),
      totalWeight: totalWeight._sum.weightKg ? Number(totalWeight._sum.weightKg) : 0,
      totalCells: cellStats._count,
      occupiedCells,
    };
  }

  // ─── Storage duration check ───────────────────────────────────────────────

  async findLongStorageParcels(warehouseId: string, daysThreshold: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysThreshold);

    return this.prisma.parcel.findMany({
      where: {
        warehouseId,
        status: { in: ['RECEIVED', 'STORED'] },
        receivedAt: { lt: cutoff },
      },
      include: {
        customer: { select: { id: true, fullName: true, clientCode: true, phone: true } },
        cell: true,
      },
      orderBy: { receivedAt: 'asc' },
    });
  }
}
