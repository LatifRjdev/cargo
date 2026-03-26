import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Marketplace, ParcelCategory, ParcelStatus } from '@prisma/client';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ParcelsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private notifications: NotificationsService,
  ) {}

  /**
   * 1. intake — worker creates a parcel for an identified customer
   */
  async intake(
    dto: {
      clientCode: string;
      marketplace: string;
      category: string;
      weightKg: number;
      lengthCm: number;
      widthCm: number;
      heightCm: number;
      description?: string;
      isFragile?: boolean;
      isDamaged?: boolean;
      damageDescription?: string;
      trackingNumber?: string;
    },
    warehouseId: string,
    changedBy: string,
  ) {
    const customer = await this.prisma.user.findUnique({
      where: { clientCode: dto.clientCode },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with client code "${dto.clientCode}" not found`,
      );
    }

    const volumetricWeight =
      (dto.lengthCm * dto.widthCm * dto.heightCm) / 6000;

    // Auto-assign storage cell: find first unoccupied cell in this warehouse
    const cell = await this.prisma.storageCell.findFirst({
      where: { warehouseId, isOccupied: false },
      orderBy: { code: 'asc' },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // Mark cell as occupied if found
      if (cell) {
        await tx.storageCell.update({
          where: { id: cell.id },
          data: { isOccupied: true },
        });
      }

      const parcel = await tx.parcel.create({
        data: {
          trackingNumber: dto.trackingNumber,
          marketplace: dto.marketplace as Marketplace,
          category: dto.category as ParcelCategory,
          description: dto.description,
          weightKg: dto.weightKg,
          lengthCm: dto.lengthCm,
          widthCm: dto.widthCm,
          heightCm: dto.heightCm,
          volumetricWeight: volumetricWeight,
          isFragile: dto.isFragile ?? false,
          isDamaged: dto.isDamaged ?? false,
          damageDescription: dto.damageDescription,
          isUnidentified: false,
          status: ParcelStatus.RECEIVED,
          receivedAt: new Date(),
          customerId: customer.id,
          warehouseId,
          cellId: cell?.id ?? null,
        },
        include: { cell: true, photos: true },
      });

      await tx.parcelStatusLog.create({
        data: {
          parcelId: parcel.id,
          status: ParcelStatus.RECEIVED,
          comment: 'Parcel received at warehouse intake',
          changedBy,
        },
      });

      return parcel;
    });

    // Audit log
    this.auditLog.log({
      userId: changedBy,
      action: 'intake',
      entityType: 'parcel',
      entityId: result.id,
      details: { clientCode: dto.clientCode, marketplace: dto.marketplace, weightKg: dto.weightKg },
    }).catch(() => {});

    // Notify customer: parcel received
    if (customer.telegramChatId) {
      const msg = `Ваша посылка принята на склад.\nМаркетплейс: ${dto.marketplace}\nВес: ${dto.weightKg} кг${dto.isDamaged ? '\n⚠️ Посылка повреждена: ' + (dto.damageDescription || '') : ''}`;
      this.notifications.send(customer.id, dto.isDamaged ? 'parcel_damaged' : 'parcel_received', msg).catch(() => {});
    }

    return result;
  }

  /**
   * 2. intakeUnidentified — intake without a known customer
   */
  async intakeUnidentified(
    dto: {
      marketplace: string;
      category: string;
      weightKg: number;
      lengthCm: number;
      widthCm: number;
      heightCm: number;
      description?: string;
      phoneOnLabel?: string;
      trackingNumber?: string;
    },
    warehouseId: string,
    changedBy: string,
  ) {
    const volumetricWeight =
      (dto.lengthCm * dto.widthCm * dto.heightCm) / 6000;

    const cell = await this.prisma.storageCell.findFirst({
      where: { warehouseId, isOccupied: false },
      orderBy: { code: 'asc' },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      if (cell) {
        await tx.storageCell.update({
          where: { id: cell.id },
          data: { isOccupied: true },
        });
      }

      const parcel = await tx.parcel.create({
        data: {
          trackingNumber: dto.trackingNumber,
          marketplace: dto.marketplace as Marketplace,
          category: dto.category as ParcelCategory,
          description: dto.description,
          weightKg: dto.weightKg,
          lengthCm: dto.lengthCm,
          widthCm: dto.widthCm,
          heightCm: dto.heightCm,
          volumetricWeight: volumetricWeight,
          isFragile: false,
          isDamaged: false,
          isUnidentified: true,
          phoneOnLabel: dto.phoneOnLabel,
          status: ParcelStatus.RECEIVED,
          receivedAt: new Date(),
          warehouseId,
          cellId: cell?.id ?? null,
        },
        include: { cell: true, photos: true },
      });

      await tx.parcelStatusLog.create({
        data: {
          parcelId: parcel.id,
          status: ParcelStatus.RECEIVED,
          comment: 'Unidentified parcel received at warehouse intake',
          changedBy,
        },
      });

      return parcel;
    });

    // Audit log
    this.auditLog.log({
      userId: changedBy,
      action: 'intake_unidentified',
      entityType: 'parcel',
      entityId: result.id,
      details: { marketplace: dto.marketplace, weightKg: dto.weightKg, phoneOnLabel: dto.phoneOnLabel },
    }).catch(() => {});

    return result;
  }

  /**
   * 3. reject — mark parcel as rejected
   */
  async reject(parcelId: string, reason: string, changedBy: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel "${parcelId}" not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Free the storage cell if one was assigned
      if (parcel.cellId) {
        await tx.storageCell.update({
          where: { id: parcel.cellId },
          data: { isOccupied: false },
        });
      }

      const result = await tx.parcel.update({
        where: { id: parcelId },
        data: {
          status: ParcelStatus.REJECTED,
          rejectReason: reason,
          cellId: null,
        },
      });

      await tx.parcelStatusLog.create({
        data: {
          parcelId,
          status: ParcelStatus.REJECTED,
          comment: reason,
          changedBy,
        },
      });

      return result;
    });

    // Audit log
    this.auditLog.log({
      userId: changedBy,
      action: 'reject',
      entityType: 'parcel',
      entityId: parcelId,
      details: { reason },
    }).catch(() => {});

    // Notify customer if parcel has owner
    if (parcel.customerId) {
      const msg = `Ваша посылка отклонена.\nПричина: ${reason}`;
      this.notifications.send(parcel.customerId, 'parcel_rejected', msg).catch(() => {});
    }

    return updated;
  }

  /**
   * 4. assignToCustomer — link an unidentified parcel to a customer (worker action)
   */
  async assignToCustomer(
    parcelId: string,
    customerId: string,
    changedBy: string,
  ) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel "${parcelId}" not found`);
    }

    if (!parcel.isUnidentified) {
      throw new BadRequestException('Parcel is already assigned to a customer');
    }

    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer "${customerId}" not found`);
    }

    return this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        customerId,
        isUnidentified: false,
      },
    });
  }

  /**
   * 5. uploadPhoto — create a ParcelPhoto record
   */
  async uploadPhoto(parcelId: string, url: string, type: string = 'intake') {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel "${parcelId}" not found`);
    }

    return this.prisma.parcelPhoto.create({
      data: {
        parcelId,
        url,
        type,
      },
    });
  }

  /**
   * 5b. addTrackingNumber — customer adds a marketplace tracking number
   *     to pre-register that they are expecting a parcel
   */
  async addTrackingNumber(
    customerId: string,
    dto: { trackingNumber: string; marketplace?: string },
  ) {
    return this.prisma.parcel.create({
      data: {
        trackingNumber: dto.trackingNumber,
        marketplace: dto.marketplace
          ? (dto.marketplace as Marketplace)
          : undefined,
        status: ParcelStatus.WAITING,
        customerId,
        isUnidentified: false,
        weightKg: 0,
        lengthCm: 0,
        widthCm: 0,
        heightCm: 0,
      },
    });
  }

  /**
   * 6. findForCustomer — list parcels for a customer with filters, paginated
   */
  async findForCustomer(
    customerId: string,
    filters: {
      status?: string;
      warehouseId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { customerId, isUnidentified: false };

    if (filters.status) {
      where.status = filters.status as ParcelStatus;
    }
    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.parcel.findMany({
        where,
        include: { photos: true, cell: true, warehouse: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 7. findUnidentifiedForCustomer — list unidentified parcels that could belong
   *    to this customer (match by phone)
   */
  async findUnidentifiedForCustomer(customerId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer "${customerId}" not found`);
    }

    return this.prisma.parcel.findMany({
      where: {
        isUnidentified: true,
        phoneOnLabel: customer.phone,
      },
      include: { photos: true, warehouse: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 8. claimParcel — customer claims an unidentified parcel
   */
  async claimParcel(parcelId: string, customerId: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel "${parcelId}" not found`);
    }

    if (!parcel.isUnidentified) {
      throw new BadRequestException(
        'This parcel is already assigned to a customer',
      );
    }

    return this.prisma.parcel.update({
      where: { id: parcelId },
      data: {
        customerId,
        isUnidentified: false,
      },
    });
  }

  /**
   * 9. findForWarehouse — list parcels in a specific warehouse with filters, paginated
   */
  async findForWarehouse(
    warehouseId: string,
    filters: {
      status?: string;
      isUnidentified?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { warehouseId };

    if (filters.status) {
      where.status = filters.status as ParcelStatus;
    }
    if (filters.isUnidentified !== undefined) {
      where.isUnidentified = filters.isUnidentified;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.parcel.findMany({
        where,
        include: { photos: true, cell: true, customer: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.parcel.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 10. findUnidentifiedForWarehouse — list unidentified parcels in a warehouse
   */
  async findUnidentifiedForWarehouse(warehouseId: string) {
    return this.prisma.parcel.findMany({
      where: {
        warehouseId,
        isUnidentified: true,
      },
      include: { photos: true, cell: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 11. findById — get parcel by id with photos and status log
   */
  async findById(parcelId: string) {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: parcelId },
      include: {
        photos: true,
        statusLog: { orderBy: { createdAt: 'desc' } },
        cell: true,
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

    if (!parcel) {
      throw new NotFoundException(`Parcel "${parcelId}" not found`);
    }

    return parcel;
  }
}
