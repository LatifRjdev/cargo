import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findByClientCode(clientCode: string) {
    return this.prisma.user.findUnique({ where: { clientCode } });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        fullName: true,
        email: true,
        role: true,
        clientCode: true,
        qrCodeUrl: true,
        language: true,
        telegramChatId: true,
        warehouseId: true,
        homeWarehouseId: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        warehouse: { select: { id: true, name: true, type: true } },
        homeWarehouse: { select: { id: true, name: true, type: true } },
        organization: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      email?: string;
      language?: 'RU' | 'TG';
      homeWarehouseId?: string;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phone: true,
        fullName: true,
        email: true,
        language: true,
        homeWarehouseId: true,
      },
    });
  }

  async getQrCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { clientCode: true, qrCodeUrl: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (!user.qrCodeUrl && user.clientCode) {
      const qrDataUrl = await QRCode.toDataURL(user.clientCode, { width: 300 });
      await this.prisma.user.update({
        where: { id: userId },
        data: { qrCodeUrl: qrDataUrl },
      });
      return { clientCode: user.clientCode, qrCodeUrl: qrDataUrl };
    }

    return { clientCode: user.clientCode, qrCodeUrl: user.qrCodeUrl };
  }

  async getQrPdf(userId: string): Promise<Buffer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { clientCode: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    // Return QR as PNG buffer (full PDF with pdfkit will be added in Phase 2)
    const buffer = await QRCode.toBuffer(user.clientCode!, { width: 400 });
    return buffer;
  }
}
