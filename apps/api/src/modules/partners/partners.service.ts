import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PartnerShipmentStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  // ─── Partner CRUD ──────────────────────────────────────────────────────

  async listPartners() {
    return this.prisma.partner.findMany({
      include: { _count: { select: { shipments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPartner(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        shipments: {
          include: {
            box: { select: { boxCode: true, status: true } },
            customer: { select: { fullName: true, clientCode: true } },
            statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        statusMappings: true,
        _count: { select: { shipments: true } },
      },
    });
    if (!partner) throw new NotFoundException('Партнёр не найден');
    return partner;
  }

  async createPartner(data: {
    name: string;
    code: string;
    integration: string;
    trackingUrlTemplate?: string;
    apiBaseUrl?: string;
    webhookUrl?: string;
    contactPhone?: string;
    contactEmail?: string;
    contactPerson?: string;
    notes?: string;
  }) {
    // Generate API key for WEBHOOK and API integrations
    const needsApiKey = data.integration !== 'MANUAL';
    const apiKey = needsApiKey ? `pk_${randomBytes(24).toString('hex')}` : null;
    const apiSecret = needsApiKey ? `sk_${randomBytes(32).toString('hex')}` : null;

    return this.prisma.partner.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        integration: data.integration as any,
        apiKey,
        apiSecret,
        apiBaseUrl: data.apiBaseUrl,
        webhookUrl: data.webhookUrl,
        trackingUrlTemplate: data.trackingUrlTemplate,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactPerson: data.contactPerson,
        notes: data.notes,
      },
    });
  }

  async updatePartner(id: string, data: Record<string, any>) {
    return this.prisma.partner.update({ where: { id }, data });
  }

  async regenerateApiKey(id: string) {
    const apiKey = `pk_${randomBytes(24).toString('hex')}`;
    const apiSecret = `sk_${randomBytes(32).toString('hex')}`;
    return this.prisma.partner.update({
      where: { id },
      data: { apiKey, apiSecret },
    });
  }

  // ─── Status Mappings ───────────────────────────────────────────────────

  async upsertStatusMapping(partnerId: string, partnerStatus: string, mappedStatus: string) {
    return this.prisma.partnerStatusMapping.upsert({
      where: { partnerId_partnerStatus: { partnerId, partnerStatus } },
      update: { mappedStatus: mappedStatus as PartnerShipmentStatus },
      create: { partnerId, partnerStatus, mappedStatus: mappedStatus as PartnerShipmentStatus },
    });
  }

  async deleteStatusMapping(id: string) {
    return this.prisma.partnerStatusMapping.delete({ where: { id } });
  }

  // ─── Shipments ─────────────────────────────────────────────────────────

  async createShipment(data: {
    partnerId: string;
    partnerTrackingCode: string;
    boxId?: string;
    customerId?: string;
    estimatedDelivery?: string;
    notes?: string;
  }) {
    return this.prisma.partnerShipment.create({
      data: {
        partnerId: data.partnerId,
        partnerTrackingCode: data.partnerTrackingCode,
        boxId: data.boxId || null,
        customerId: data.customerId || null,
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : null,
        notes: data.notes,
        status: 'CREATED',
      },
      include: {
        partner: { select: { name: true, code: true } },
        box: { select: { boxCode: true } },
        customer: { select: { fullName: true, clientCode: true } },
      },
    });
  }

  async listShipments(filters?: { partnerId?: string; status?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const where: any = {};
    if (filters?.partnerId) where.partnerId = filters.partnerId;
    if (filters?.status) where.status = filters.status;

    const [items, total] = await Promise.all([
      this.prisma.partnerShipment.findMany({
        where,
        include: {
          partner: { select: { name: true, code: true, integration: true } },
          box: { select: { id: true, boxCode: true, status: true } },
          customer: { select: { id: true, fullName: true, clientCode: true } },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.partnerShipment.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ─── Status Update (used by all 3 integration levels) ──────────────────

  async updateShipmentStatus(
    shipmentId: string,
    status: string,
    options: { rawStatus?: string; location?: string; comment?: string; source?: string } = {},
  ) {
    const shipment = await this.prisma.partnerShipment.findUnique({
      where: { id: shipmentId },
      include: { partner: { include: { statusMappings: true } } },
    });
    if (!shipment) throw new NotFoundException('Отправка не найдена');

    // Map partner status to our status using mappings
    let mappedStatus: PartnerShipmentStatus = status as PartnerShipmentStatus;
    if (options.rawStatus && shipment.partner.statusMappings.length > 0) {
      const mapping = shipment.partner.statusMappings.find(m => m.partnerStatus === options.rawStatus);
      if (mapping) mappedStatus = mapping.mappedStatus;
    }

    // Update shipment
    const updated = await this.prisma.partnerShipment.update({
      where: { id: shipmentId },
      data: {
        status: mappedStatus,
        partnerStatus: options.rawStatus || status,
        lastSyncAt: new Date(),
        ...(mappedStatus === 'DELIVERED' ? { actualDelivery: new Date() } : {}),
      },
    });

    // Log
    await this.prisma.partnerShipmentLog.create({
      data: {
        shipmentId,
        status: mappedStatus,
        rawStatus: options.rawStatus,
        location: options.location,
        comment: options.comment,
        source: options.source || 'manual',
      },
    });

    // If linked to a box, update box status too
    if (shipment.boxId) {
      const boxStatusMap: Record<string, string> = {
        IN_TRANSIT: 'IN_TRANSIT',
        CUSTOMS: 'CUSTOMS',
        ARRIVED: 'ARRIVED',
        DELIVERED: 'READY', // партнёр доставил = готово к выдаче у нас
      };
      const newBoxStatus = boxStatusMap[mappedStatus];
      if (newBoxStatus) {
        await this.prisma.consolidationBox.update({
          where: { id: shipment.boxId },
          data: { status: newBoxStatus as any },
        });
        await this.prisma.boxStatusLog.create({
          data: {
            boxId: shipment.boxId,
            status: newBoxStatus as any,
            comment: `Обновлено партнёром ${shipment.partner.name}: ${options.rawStatus || status}`,
          },
        });
      }
    }

    return updated;
  }

  // ─── Webhook handler (Level 2) ────────────────────────────────────────

  async handleWebhook(apiKey: string, payload: {
    trackingCode: string;
    status: string;
    location?: string;
    comment?: string;
    estimatedDelivery?: string;
  }) {
    const partner = await this.prisma.partner.findUnique({ where: { apiKey } });
    if (!partner) throw new BadRequestException('Invalid API key');
    if (partner.integration !== 'WEBHOOK') throw new BadRequestException('Partner not configured for webhooks');

    const shipment = await this.prisma.partnerShipment.findUnique({
      where: { partnerId_partnerTrackingCode: { partnerId: partner.id, partnerTrackingCode: payload.trackingCode } },
    });
    if (!shipment) throw new NotFoundException(`Shipment ${payload.trackingCode} not found`);

    if (payload.estimatedDelivery) {
      await this.prisma.partnerShipment.update({
        where: { id: shipment.id },
        data: { estimatedDelivery: new Date(payload.estimatedDelivery) },
      });
    }

    return this.updateShipmentStatus(shipment.id, payload.status, {
      rawStatus: payload.status,
      location: payload.location,
      comment: payload.comment,
      source: 'webhook',
    });
  }

  // ─── API Polling (Level 3) ─────────────────────────────────────────────

  async pollPartnerStatus(shipmentId: string) {
    const shipment = await this.prisma.partnerShipment.findUnique({
      where: { id: shipmentId },
      include: { partner: true },
    });
    if (!shipment) throw new NotFoundException('Отправка не найдена');
    if (shipment.partner.integration !== 'API') throw new BadRequestException('Partner not configured for API polling');
    if (!shipment.partner.apiBaseUrl) throw new BadRequestException('Partner API URL not configured');

    try {
      const res = await fetch(`${shipment.partner.apiBaseUrl}/track/${shipment.partnerTrackingCode}`, {
        headers: {
          'Authorization': `Bearer ${shipment.partner.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Partner API returned ${res.status}`);

      const data = await res.json();
      return this.updateShipmentStatus(shipment.id, data.status, {
        rawStatus: data.status,
        location: data.location,
        comment: data.comment || 'Auto-synced from partner API',
        source: 'api_poll',
      });
    } catch (err: any) {
      throw new BadRequestException(`Ошибка при запросе к API партнёра: ${err.message}`);
    }
  }

  // ─── Bulk poll all API partners ────────────────────────────────────────

  async pollAllApiPartners() {
    const shipments = await this.prisma.partnerShipment.findMany({
      where: {
        partner: { integration: 'API', isActive: true },
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      include: { partner: true },
    });

    const results = { synced: 0, errors: 0 };
    for (const s of shipments) {
      try {
        await this.pollPartnerStatus(s.id);
        results.synced++;
      } catch {
        results.errors++;
      }
    }
    return results;
  }
}
