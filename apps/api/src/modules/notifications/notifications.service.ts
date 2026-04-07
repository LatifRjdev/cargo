import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../ws/events.gateway';
import { EmailService } from './email.service';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

type Lang = 'RU' | 'TG';

const templates: Record<string, Record<Lang, (...args: string[]) => string>> = {
  parcel_received: {
    RU: (tracking) => `📦 Посылка ${tracking} принята на складе в Китае.`,
    TG: (tracking) => `📦 Бастаи ${tracking} дар анбори Чин қабул шуд.`,
  },
  parcel_stored: {
    RU: (tracking) => `📦 Посылка ${tracking} размещена на складе.`,
    TG: (tracking) => `📦 Бастаи ${tracking} дар анбор ҷойгир шуд.`,
  },
  box_packed: {
    RU: (boxCode) => `📦 Коробка ${boxCode} упакована и готова к отправке.`,
    TG: (boxCode) => `📦 Қуттии ${boxCode} бастабандӣ шуда, барои фиристодан тайёр аст.`,
  },
  box_shipped: {
    RU: (boxCode) => `🚚 Коробка ${boxCode} отправлена. Ожидайте доставку.`,
    TG: (boxCode) => `🚚 Қуттии ${boxCode} фиристода шуд. Интизори расонидан бошед.`,
  },
  box_delivered: {
    RU: (boxCode) => `✅ Коробка ${boxCode} доставлена в пункт выдачи. Заберите её!`,
    TG: (boxCode) => `✅ Қуттии ${boxCode} ба нуқтаи додан расид. Онро гиред!`,
  },
  payment_received: {
    RU: (amount) => `💰 Оплата ${amount} получена. Спасибо!`,
    TG: (amount) => `💰 Пардохти ${amount} қабул шуд. Ташаккур!`,
  },
  storage_warning: {
    RU: (tracking, days) => `⚠️ Посылка ${tracking} хранится на складе ${days} дней. Создайте коробку для отправки.`,
    TG: (tracking, days) => `⚠️ Бастаи ${tracking} ${days} рӯз дар анбор аст. Барои фиристодан қуттӣ созед.`,
  },
  broadcast: {
    RU: (msg) => msg,
    TG: (msg) => msg,
  },
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(EventsGateway) private ws?: EventsGateway,
    @Optional() @Inject(EmailService) private email?: EmailService,
  ) {}

  formatMessage(event: string, lang: Lang, ...args: string[]): string {
    const tpl = templates[event];
    if (!tpl || !tpl[lang]) return args[0] || event;
    return tpl[lang](...args);
  }

  async sendLocalized(userId: string, event: string, ...args: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { language: true },
    });
    const lang = (user?.language as Lang) || 'RU';
    const message = this.formatMessage(event, lang, ...args);
    return this.send(userId, event, message);
  }

  async send(userId: string, event: string, message: string) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        channel: 'TELEGRAM',
        event,
        message,
        status: 'QUEUED',
      },
    });

    // Emit via WebSocket (real-time to browser)
    if (this.ws) {
      this.ws.sendToUser(userId, 'notification', {
        id: notification.id,
        event,
        message,
        createdAt: notification.createdAt,
      });
    }

    // Fire-and-forget email delivery
    if (this.email) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user?.email) {
        const { subject, html } = this.email.buildNotificationEmail(event, message);
        this.email.send(user.email, subject, html).catch(() => {});
      }
    }

    // Fire-and-forget Telegram delivery with retry
    this.deliver(notification.id, userId, message).catch((err) => {
      this.logger.error(`Failed to deliver notification ${notification.id}: ${err.message}`);
    });

    return notification;
  }

  private async deliver(notificationId: string, userId: string, message: string) {
    // Look up user's telegram chat ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    });

    if (!user?.telegramChatId) {
      // No Telegram linked — mark as failed
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' },
      });
      return;
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      this.logger.warn('BOT_TOKEN not set, skipping Telegram delivery');
      return;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: user.telegramChatId,
              text: message,
              parse_mode: 'HTML',
            }),
          },
        );

        if (res.ok) {
          await this.prisma.notification.update({
            where: { id: notificationId },
            data: { status: 'SENT', sentAt: new Date() },
          });
          return;
        }

        const body = await res.text();
        lastError = new Error(`Telegram API ${res.status}: ${body}`);
        this.logger.warn(
          `Telegram delivery attempt ${attempt}/${MAX_RETRIES} failed: ${lastError.message}`,
        );
      } catch (err: any) {
        lastError = err;
        this.logger.warn(
          `Telegram delivery attempt ${attempt}/${MAX_RETRIES} error: ${err.message}`,
        );
      }

      // Wait before retry (except on last attempt)
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }

    // All retries exhausted
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'FAILED' },
    });
    this.logger.error(
      `Notification ${notificationId} failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
    );
  }
}
