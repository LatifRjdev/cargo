import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Dashboard Stats ──────────────────────────────────────────────────────

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayIntake,
      todayPacked,
      todayShipped,
      todayRevenue,
      totalParcels,
      totalBoxes,
      totalCustomers,
      pendingPickup,
      unidentifiedCount,
      parcelsByStatus,
      boxesByStatus,
    ] = await Promise.all([
      // Today's intake
      this.prisma.parcel.count({ where: { createdAt: { gte: today } } }),
      // Today's packed boxes
      this.prisma.consolidationBox.count({
        where: { status: 'PACKED', updatedAt: { gte: today } },
      }),
      // Today's shipped
      this.prisma.shipmentBatch.count({
        where: { status: 'DEPARTED', departedAt: { gte: today } },
      }),
      // Today's revenue
      this.prisma.payment.aggregate({
        where: { paidAt: { gte: today } },
        _sum: { amount: true },
      }),
      // Totals
      this.prisma.parcel.count(),
      this.prisma.consolidationBox.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      // Pending pickup
      this.prisma.consolidationBox.count({ where: { status: 'READY' } }),
      // Unidentified parcels
      this.prisma.parcel.count({ where: { isUnidentified: true } }),
      // Parcels by status
      this.prisma.parcel.groupBy({ by: ['status'], _count: true }),
      // Boxes by status
      this.prisma.consolidationBox.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      today: {
        intake: todayIntake,
        packed: todayPacked,
        shipped: todayShipped,
        revenue: todayRevenue._sum.amount ? Number(todayRevenue._sum.amount) : 0,
      },
      totals: {
        parcels: totalParcels,
        boxes: totalBoxes,
        customers: totalCustomers,
        pendingPickup,
        unidentified: unidentifiedCount,
      },
      parcelsByStatus: parcelsByStatus.map((s) => ({ status: s.status, count: s._count })),
      boxesByStatus: boxesByStatus.map((s) => ({ status: s.status, count: s._count })),
    };
  }

  async getDashboardTrends(days = 14) {
    const results: { date: string; intake: number; packed: number; revenue: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const [intake, packed, revenue] = await Promise.all([
        this.prisma.parcel.count({ where: { createdAt: { gte: start, lt: end } } }),
        this.prisma.consolidationBox.count({ where: { status: 'PACKED', updatedAt: { gte: start, lt: end } } }),
        this.prisma.payment.aggregate({ where: { paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
      ]);

      results.push({
        date: start.toISOString().slice(0, 10),
        intake,
        packed,
        revenue: revenue._sum.amount ? Number(revenue._sum.amount) : 0,
      });
    }

    return results;
  }

  // ─── Global Search ────────────────────────────────────────────────────────

  async search(query: string) {
    const q = query.trim();
    if (!q) return { clients: [], parcels: [], boxes: [], batches: [] };

    const [clients, parcels, boxes, batches] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { clientCode: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        },
        select: { id: true, fullName: true, clientCode: true, phone: true, role: true },
        take: 10,
      }),
      this.prisma.parcel.findMany({
        where: {
          OR: [
            { trackingNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, trackingNumber: true, status: true, marketplace: true },
        take: 10,
      }),
      this.prisma.consolidationBox.findMany({
        where: { boxCode: { contains: q, mode: 'insensitive' } },
        select: { id: true, boxCode: true, status: true },
        take: 10,
      }),
      this.prisma.shipmentBatch.findMany({
        where: { batchCode: { contains: q, mode: 'insensitive' } },
        select: { id: true, batchCode: true, status: true, route: true },
        take: 10,
      }),
    ]);

    return { clients, parcels, boxes, batches };
  }

  // ─── User Management ──────────────────────────────────────────────────────

  async listUsers(filters: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.role) where.role = filters.role;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { clientCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          phone: true,
          clientCode: true,
          role: true,
          isActive: true,
          createdAt: true,
          warehouseId: true,
          warehouse: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getUserDetail(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        parcels: { take: 10, orderBy: { createdAt: 'desc' } },
        boxes: { take: 10, orderBy: { createdAt: 'desc' } },
        warehouse: true,
      },
    });
  }

  async updateUserRole(userId: string, role: string, warehouseId?: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any, warehouseId: warehouseId || null },
    });
  }

  async toggleUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async createWorker(data: { fullName: string; phone: string; role: string; warehouseId?: string }) {
    // Generate a client code
    const count = await this.prisma.user.count();
    const clientCode = `CD-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.user.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        role: data.role as any,
        clientCode,
        warehouseId: data.warehouseId || null,
        isActive: true,
      },
    });
  }

  // ─── Tariff Management ────────────────────────────────────────────────────

  async listTariffs() {
    return this.prisma.tariff.findMany({
      include: {
        origin: { select: { name: true, address: true } },
        destination: { select: { name: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertTariff(data: {
    id?: string;
    originId: string;
    destinationId: string;
    ratePerKg: number;
    minPrice: number;
    currency: string;
    isActive: boolean;
  }) {
    if (data.id) {
      return this.prisma.tariff.update({
        where: { id: data.id },
        data: {
          originId: data.originId,
          destinationId: data.destinationId,
          ratePerKg: data.ratePerKg,
          minPrice: data.minPrice,
          currency: data.currency as any,
          isActive: data.isActive,
        },
      });
    }
    return this.prisma.tariff.create({
      data: {
        originId: data.originId,
        destinationId: data.destinationId,
        ratePerKg: data.ratePerKg,
        minPrice: data.minPrice,
        currency: data.currency as any,
        isActive: data.isActive,
      },
    });
  }

  // ─── Warehouse Management ─────────────────────────────────────────────────

  async listWarehouses() {
    return this.prisma.warehouse.findMany({
      include: {
        _count: { select: { cells: true, parcels: true, boxes: true } },
      },
    });
  }

  async upsertWarehouse(data: {
    id?: string;
    name: string;
    address: string;
    phone?: string;
    type: string;
    isActive: boolean;
  }) {
    if (data.id) {
      return this.prisma.warehouse.update({
        where: { id: data.id },
        data: {
          name: data.name,
          address: data.address,
          phone: data.phone,
          type: data.type as any,
          isActive: data.isActive,
        },
      });
    }
    return this.prisma.warehouse.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        type: data.type as any,
        isActive: data.isActive,
      },
    });
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.setting.findMany();
  }

  async updateSetting(key: string, value: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // ─── Prohibited Items (stored in settings as JSON) ────────────────────────

  async getProhibitedItems(): Promise<string[]> {
    const setting = await this.prisma.setting.findUnique({ where: { key: 'prohibited_items' } });
    if (!setting) return [];
    try { return JSON.parse(setting.value); } catch { return []; }
  }

  async addProhibitedItem(item: string) {
    const items = await this.getProhibitedItems();
    if (items.includes(item)) return items;
    items.push(item);
    await this.prisma.setting.upsert({
      where: { key: 'prohibited_items' },
      update: { value: JSON.stringify(items) },
      create: { key: 'prohibited_items', value: JSON.stringify(items) },
    });
    return items;
  }

  async removeProhibitedItem(item: string) {
    const items = await this.getProhibitedItems();
    const filtered = items.filter((i) => i !== item);
    await this.prisma.setting.upsert({
      where: { key: 'prohibited_items' },
      update: { value: JSON.stringify(filtered) },
      create: { key: 'prohibited_items', value: JSON.stringify(filtered) },
    });
    return filtered;
  }

  // ─── Audit Log ────────────────────────────────────────────────────────────

  async getAuditLog(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ─── Reports ────────────────────────────────────────────────────────────────

  async revenueReport(filters: { from?: string; to?: string; warehouseId?: string }) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.paidAt = {};
      if (filters.from) where.paidAt.gte = new Date(filters.from);
      if (filters.to) where.paidAt.lte = new Date(filters.to + 'T23:59:59');
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        box: {
          select: {
            boxCode: true,
            warehouseId: true,
            warehouse: { select: { name: true } },
            batch: { select: { route: true } },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    let filtered = payments;
    if (filters.warehouseId) {
      filtered = payments.filter((p) => p.box?.warehouseId === filters.warehouseId);
    }

    const totalRevenue = filtered.reduce((s, p) => s + Number(p.amount), 0);
    const byCurrency: Record<string, number> = {};
    filtered.forEach((p) => {
      byCurrency[p.currency] = (byCurrency[p.currency] || 0) + Number(p.amount);
    });

    return {
      payments: filtered.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        method: p.method,
        paidAt: p.paidAt,
        boxCode: p.box?.boxCode,
        warehouse: p.box?.warehouse?.name,
        route: p.box?.batch?.route,
      })),
      totalRevenue,
      byCurrency,
      count: filtered.length,
    };
  }

  async parcelsReport(filters: { from?: string; to?: string; warehouseId?: string; marketplace?: string }) {
    const where: any = {};
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to + 'T23:59:59');
    }
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.marketplace) where.marketplace = filters.marketplace;

    const [parcels, byStatus, byMarketplace] = await Promise.all([
      this.prisma.parcel.count({ where }),
      this.prisma.parcel.groupBy({ by: ['status'], where, _count: true }),
      this.prisma.parcel.groupBy({ by: ['marketplace'], where, _count: true }),
    ]);

    return {
      total: parcels,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byMarketplace: byMarketplace.map((m) => ({
        marketplace: m.marketplace || 'Unknown',
        count: m._count,
      })),
    };
  }

  async deliveryTimeReport() {
    const deliveredBoxes = await this.prisma.consolidationBox.findMany({
      where: { status: 'DELIVERED' },
      select: {
        id: true,
        boxCode: true,
        createdAt: true,
        updatedAt: true,
        batch: { select: { route: true, departedAt: true } },
      },
    });

    const byRoute: Record<string, { total: number; count: number }> = {};
    deliveredBoxes.forEach((box) => {
      const route = box.batch?.route || 'Unknown';
      const days = Math.ceil(
        (box.updatedAt.getTime() - box.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (!byRoute[route]) byRoute[route] = { total: 0, count: 0 };
      byRoute[route].total += days;
      byRoute[route].count += 1;
    });

    return Object.entries(byRoute).map(([route, data]) => ({
      route,
      avgDays: Math.round(data.total / data.count),
      totalDelivered: data.count,
    }));
  }

  async debtsReport() {
    const unpaidBoxes = await this.prisma.consolidationBox.findMany({
      where: {
        status: { in: ['ARRIVED', 'READY'] },
        payment: null,
        finalPrice: { gt: 0 },
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, clientCode: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byCustomer: Record<string, { customer: any; boxes: any[]; totalDebt: number }> = {};
    unpaidBoxes.forEach((box) => {
      const cid = box.customerId;
      if (!byCustomer[cid]) {
        byCustomer[cid] = { customer: (box as any).customer, boxes: [], totalDebt: 0 };
      }
      byCustomer[cid].boxes.push({
        id: box.id,
        boxCode: box.boxCode,
        price: Number(box.finalPrice),
        currency: box.currency,
        createdAt: box.createdAt,
      });
      byCustomer[cid].totalDebt += Number(box.finalPrice);
    });

    return {
      totalUnpaid: unpaidBoxes.length,
      totalDebt: unpaidBoxes.reduce((s, b) => s + Number(b.finalPrice), 0),
      byCustomer: Object.values(byCustomer).sort((a, b) => b.totalDebt - a.totalDebt),
    };
  }

  async marketplacesReport() {
    const data = await this.prisma.parcel.groupBy({
      by: ['marketplace'],
      _count: true,
      _sum: { weightKg: true },
    });

    return data
      .map((d) => ({
        marketplace: d.marketplace || 'Не указан',
        count: d._count,
        totalWeight: d._sum?.weightKg ? Number(d._sum.weightKg) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async categoriesReport() {
    const data = await this.prisma.parcel.groupBy({
      by: ['category'],
      _count: true,
      _sum: { weightKg: true },
    });

    return data
      .map((d) => ({
        category: d.category || 'Не указана',
        count: d._count,
        totalWeight: d._sum?.weightKg ? Number(d._sum.weightKg) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async exportReportCsv(type: string, filters?: Record<string, string>): Promise<string> {
    let rows: string[][] = [];
    let headers: string[] = [];

    if (type === 'revenue') {
      const data = await this.revenueReport(filters || {});
      headers = ['Дата', 'Коробка', 'Склад', 'Маршрут', 'Метод', 'Сумма', 'Валюта'];
      rows = (data.payments || []).map((p: any) => [
        p.paidAt ? new Date(p.paidAt).toISOString().split('T')[0] : '',
        p.boxCode || '', p.warehouse || '', p.route || '', p.method || '',
        String(p.amount), p.currency || '',
      ]);
    } else if (type === 'marketplaces') {
      const data = await this.marketplacesReport();
      headers = ['Маркетплейс', 'Количество', 'Вес (кг)'];
      rows = data.map((m) => [m.marketplace, String(m.count), String(m.totalWeight)]);
    } else if (type === 'categories') {
      const data = await this.categoriesReport();
      headers = ['Категория', 'Количество', 'Вес (кг)'];
      rows = data.map((c) => [String(c.category), String(c.count), String(c.totalWeight)]);
    } else if (type === 'debts') {
      const data = await this.debtsReport();
      headers = ['Клиент', 'Телефон', 'Коробка', 'Сумма', 'Валюта'];
      rows = (data.byCustomer || []).flatMap((c: any) =>
        c.boxes.map((b: any) => [
          c.customer?.fullName || '', c.customer?.phone || '',
          b.boxCode, String(b.price), b.currency,
        ]),
      );
    }

    const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csvLines = [headers.map(escapeCsv).join(',')];
    for (const row of rows) {
      csvLines.push(row.map(escapeCsv).join(','));
    }
    return csvLines.join('\n');
  }

  async storageReport(minDays: number = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - minDays);

    const parcels = await this.prisma.parcel.findMany({
      where: {
        status: { in: ['RECEIVED', 'STORED'] },
        createdAt: { lte: cutoff },
      },
      include: {
        customer: { select: { id: true, fullName: true, phone: true, clientCode: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return parcels.map((p) => ({
      id: p.id,
      trackingNumber: p.trackingNumber,
      status: p.status,
      storageDays: Math.ceil((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      weight: p.weightKg ? Number(p.weightKg) : null,
      customer: (p as any).customer,
      warehouse: (p as any).warehouse?.name,
      createdAt: p.createdAt,
    }));
  }

  // ─── Broadcast Notification ─────────────────────────────────────────────────

  async broadcastNotification(message: string, target: 'all' | 'warehouse' | 'selected', userIds?: string[], warehouseId?: string) {
    let users: { id: string }[];

    if (target === 'all') {
      users = await this.prisma.user.findMany({
        where: { isActive: true, telegramChatId: { not: null } },
        select: { id: true },
      });
    } else if (target === 'warehouse' && warehouseId) {
      users = await this.prisma.user.findMany({
        where: { isActive: true, warehouseId, telegramChatId: { not: null } },
        select: { id: true },
      });
    } else if (target === 'selected' && userIds?.length) {
      users = userIds.map((id) => ({ id }));
    } else {
      return { sent: 0 };
    }

    // Create notifications for all users
    const notifications = await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        channel: 'TELEGRAM' as const,
        event: 'broadcast',
        message,
      })),
    });

    return { sent: notifications.count };
  }

  // ─── Unidentified Parcels ──────────────────────────────────────────────────

  async listUnidentifiedParcels() {
    return this.prisma.parcel.findMany({
      where: { isUnidentified: true },
      include: {
        warehouse: { select: { name: true } },
        photos: { select: { url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── List Boxes ────────────────────────────────────────────────────────────

  async listBoxes(query: { status?: string; page?: string; limit?: string }) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const where: any = {};
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.consolidationBox.findMany({
        where,
        include: {
          customer: { select: { id: true, fullName: true, clientCode: true, phone: true } },
          warehouse: { select: { name: true } },
          batch: { select: { batchCode: true, route: true } },
          _count: { select: { parcels: true } },
          payment: { select: { id: true, status: true } },
          statusLog: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.consolidationBox.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ─── Box Price Override ─────────────────────────────────────────────────────

  async overrideBoxPrice(boxId: string, newPrice: number) {
    return this.prisma.consolidationBox.update({
      where: { id: boxId },
      data: { finalPrice: newPrice },
    });
  }

  // ─── Credit Limit Check ──────────────────────────────────────────────────

  async checkCreditLimit(customerId: string): Promise<{ allowed: boolean; limit: number; debt: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      return { allowed: true, limit: 0, debt: 0 };
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { creditLimit: true, currentDebt: true, isActive: true },
    });

    if (!org || !org.isActive) {
      return { allowed: true, limit: 0, debt: 0 };
    }

    const limit = Number(org.creditLimit);
    const debt = Number(org.currentDebt);
    return { allowed: debt < limit, limit, debt };
  }

  // ─── Organizations (B2B) ────────────────────────────────────────────────────

  async listOrganizations() {
    return this.prisma.organization.findMany({
      include: {
        _count: { select: { members: true, orgTariffs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrganization(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: { select: { id: true, fullName: true, phone: true, clientCode: true } },
        orgTariffs: {
          include: {
            tariff: {
              include: {
                origin: { select: { name: true } },
                destination: { select: { name: true } },
              },
            },
          },
        },
      },
    });
  }

  async upsertOrganization(data: {
    id?: string;
    name: string;
    bin?: string;
    creditLimit: number;
    contactPhone?: string;
    isActive: boolean;
  }) {
    if (data.id) {
      return this.prisma.organization.update({
        where: { id: data.id },
        data: {
          name: data.name,
          bin: data.bin,
          creditLimit: data.creditLimit,
          contactPhone: data.contactPhone,
          isActive: data.isActive,
        },
      });
    }
    return this.prisma.organization.create({
      data: {
        name: data.name,
        bin: data.bin,
        creditLimit: data.creditLimit,
        contactPhone: data.contactPhone,
        isActive: data.isActive,
      },
    });
  }

  async addOrgMember(orgId: string, userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: orgId },
    });
  }

  async removeOrgMember(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null },
    });
  }

  async upsertOrgTariff(data: {
    organizationId: string;
    tariffId: string;
    ratePerKg?: number;
    discountPct?: number;
  }) {
    return this.prisma.orgTariff.upsert({
      where: {
        organizationId_tariffId: {
          organizationId: data.organizationId,
          tariffId: data.tariffId,
        },
      },
      update: {
        ratePerKg: data.ratePerKg,
        discountPct: data.discountPct,
      },
      create: {
        organizationId: data.organizationId,
        tariffId: data.tariffId,
        ratePerKg: data.ratePerKg,
        discountPct: data.discountPct,
      },
    });
  }

  async deleteOrgTariff(orgId: string, tariffId: string) {
    return this.prisma.orgTariff.delete({
      where: {
        organizationId_tariffId: {
          organizationId: orgId,
          tariffId: tariffId,
        },
      },
    });
  }

  // ─── Customer Analytics ────────────────────────────────────────────────────

  async getCustomerAnalytics() {
    const customers = await this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: {
        parcels: { select: { id: true, createdAt: true } },
        boxes: {
          select: { id: true, finalPrice: true, createdAt: true, status: true },
        },
        payments: { select: { amount: true, createdAt: true } },
      },
    });

    return customers.map((c) => {
      const totalSpent = (c as any).payments?.reduce((s: number, p: any) => s + Number(p.amount || 0), 0) || 0;
      const boxCount = c.boxes.length;
      const parcelCount = c.parcels.length;
      const firstOrder = c.parcels[0]?.createdAt || c.createdAt;
      const lastOrder = c.parcels[c.parcels.length - 1]?.createdAt || c.createdAt;
      const daysSinceFirst = Math.max(1, Math.floor((Date.now() - new Date(firstOrder).getTime()) / 86400000));
      const avgOrderValue = boxCount > 0 ? totalSpent / boxCount : 0;

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        clientCode: c.clientCode,
        totalSpent: Math.round(totalSpent * 100) / 100,
        parcelCount,
        boxCount,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        ltv: Math.round(totalSpent * 100) / 100,
        daysSinceFirst,
        firstOrder,
        lastOrder,
        isActive: c.isActive,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // ─── Bulk Import ──────────────────────────────────────────────────────────

  async bulkImportParcels(csvText: string, warehouseId: string) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { imported: 0, errors: ['Файл пуст или не содержит данных'] };

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const trackIdx = header.indexOf('tracking');
    const clientIdx = header.indexOf('client_code');
    const marketIdx = header.indexOf('marketplace');
    const weightIdx = header.indexOf('weight');
    const categoryIdx = header.indexOf('category');

    if (trackIdx === -1) return { imported: 0, errors: ['Столбец "tracking" не найден'] };

    const results: { imported: number; errors: string[] } = { imported: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const tracking = cols[trackIdx];
      if (!tracking) { results.errors.push(`Строка ${i + 1}: пустой tracking`); continue; }

      const clientCode = clientIdx >= 0 ? cols[clientIdx] : null;
      let customerId: string | null = null;

      if (clientCode) {
        const user = await this.prisma.user.findUnique({ where: { clientCode } });
        if (!user) { results.errors.push(`Строка ${i + 1}: клиент ${clientCode} не найден`); continue; }
        customerId = user.id;
      }

      try {
        await this.prisma.parcel.create({
          data: {
            trackingNumber: tracking,
            customerId,
            warehouseId,
            marketplace: marketIdx >= 0 ? (cols[marketIdx] as any) || null : null,
            weightKg: weightIdx >= 0 && cols[weightIdx] ? parseFloat(cols[weightIdx]) : null,
            category: categoryIdx >= 0 ? (cols[categoryIdx] as any) || null : null,
            status: 'RECEIVED',
            receivedAt: new Date(),
            isUnidentified: !customerId,
          },
        });
        results.imported++;
      } catch (err: any) {
        results.errors.push(`Строка ${i + 1}: ${err.message?.slice(0, 80)}`);
      }
    }

    return results;
  }
}
