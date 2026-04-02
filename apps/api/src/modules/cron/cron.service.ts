import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PartnersService } from '../partners/partners.service';

const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/USD';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private partners: PartnersService,
  ) {}

  /**
   * Every 30 minutes — poll partner APIs for status updates (Level 3)
   */
  @Cron('0 */30 * * * *')
  async pollPartnerApis() {
    this.logger.log('Polling partner APIs...');
    try {
      const result = await this.partners.pollAllApiPartners();
      this.logger.log(`Partner API poll: ${result.synced} synced, ${result.errors} errors`);
    } catch (err: any) {
      this.logger.error(`Partner API poll failed: ${err.message}`);
    }
  }

  /**
   * Daily at 09:00 — check for parcels stored too long (> 30 days)
   * Send storage_warning notification to the customer.
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkStorageDurations() {
    this.logger.log('Running storage duration check...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const longStoredParcels = await this.prisma.parcel.findMany({
      where: {
        status: { in: ['RECEIVED', 'STORED'] },
        receivedAt: { lte: thirtyDaysAgo },
        customerId: { not: null },
      },
      select: {
        id: true,
        trackingNumber: true,
        customerId: true,
        receivedAt: true,
      },
    });

    let sent = 0;
    for (const parcel of longStoredParcels) {
      if (!parcel.customerId) continue;

      const storageDays = Math.floor(
        (Date.now() - new Date(parcel.receivedAt!).getTime()) / (1000 * 60 * 60 * 24),
      );

      // Only notify every 7 days (30, 37, 44, ... days)
      if (storageDays % 7 !== 0) continue;

      try {
        await this.notifications.sendLocalized(
          parcel.customerId,
          'storage_warning',
          parcel.trackingNumber || parcel.id,
          storageDays.toString(),
        );
        sent++;
      } catch (err: any) {
        this.logger.error(`Failed to send storage warning for ${parcel.id}: ${err.message}`);
      }
    }

    this.logger.log(`Storage check complete. Sent ${sent} warnings.`);
  }

  /**
   * Daily at 10:00 — check for unclaimed parcels (> 90 days)
   * These parcels have no customer assigned.
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkUnclaimedParcels() {
    this.logger.log('Running unclaimed parcels check...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const unclaimed = await this.prisma.parcel.findMany({
      where: {
        customerId: null,
        status: { in: ['RECEIVED', 'STORED'] },
        receivedAt: { lte: ninetyDaysAgo },
      },
      include: {
        warehouse: { select: { name: true } },
      },
    });

    if (unclaimed.length > 0) {
      // Notify all admins about unclaimed parcels
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        try {
          await this.notifications.send(
            admin.id,
            'unclaimed_warning',
            `⚠️ ${unclaimed.length} неопознанных посылок на складе более 90 дней. Проверьте раздел "Неопознанные" в админ-панели.`,
          );
        } catch (err: any) {
          this.logger.error(`Failed to notify admin ${admin.id}: ${err.message}`);
        }
      }
    }

    this.logger.log(`Unclaimed check complete. Found ${unclaimed.length} parcels > 90 days.`);
  }

  /**
   * Every 6 hours — fetch exchange rates from external API and update DB.
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async updateExchangeRates() {
    this.logger.log('Fetching exchange rates...');

    try {
      const res = await fetch(EXCHANGE_API_URL);
      if (!res.ok) {
        this.logger.warn(`Exchange rate API returned ${res.status}`);
        return;
      }
      const data = await res.json();
      const rates = data.rates as Record<string, number>;
      if (!rates) return;

      const pairs: { from: string; to: string; rate: number }[] = [
        { from: 'USD', to: 'CNY', rate: rates['CNY'] || 0 },
        { from: 'USD', to: 'TJS', rate: rates['TJS'] || 0 },
        { from: 'USD', to: 'RUB', rate: rates['RUB'] || 0 },
        { from: 'CNY', to: 'USD', rate: rates['CNY'] ? 1 / rates['CNY'] : 0 },
        { from: 'CNY', to: 'TJS', rate: rates['CNY'] && rates['TJS'] ? rates['TJS'] / rates['CNY'] : 0 },
        { from: 'TJS', to: 'USD', rate: rates['TJS'] ? 1 / rates['TJS'] : 0 },
        { from: 'RUB', to: 'USD', rate: rates['RUB'] ? 1 / rates['RUB'] : 0 },
      ];

      let updated = 0;
      for (const pair of pairs) {
        if (!pair.rate || pair.rate <= 0) continue;
        try {
          await this.prisma.exchangeRate.upsert({
            where: {
              fromCurrency_toCurrency: {
                fromCurrency: pair.from as any,
                toCurrency: pair.to as any,
              },
            },
            update: { rate: pair.rate },
            create: {
              fromCurrency: pair.from as any,
              toCurrency: pair.to as any,
              rate: pair.rate,
            },
          });
          updated++;
        } catch (err: any) {
          this.logger.warn(`Failed to update ${pair.from}->${pair.to}: ${err.message}`);
        }
      }

      this.logger.log(`Exchange rates updated: ${updated} pairs.`);
    } catch (err: any) {
      this.logger.error(`Exchange rate fetch failed: ${err.message}`);
    }
  }
}
