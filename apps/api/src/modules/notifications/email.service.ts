import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;

  constructor(private config: ConfigService) {
    this.fromAddress = this.config.get('SMTP_FROM') || 'noreply@cargo.tj';
  }

  async onModuleInit() {
    const host = this.config.get('SMTP_HOST');
    if (!host) {
      this.logger.warn('SMTP_HOST not configured — email notifications disabled');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(this.config.get('SMTP_PORT') || '587', 10),
      secure: this.config.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });

    try {
      await this.transporter.verify();
      this.logger.log(`Email transport ready (${host})`);
    } catch (err) {
      this.logger.warn(`SMTP connection failed: ${(err as Error).message}`);
      this.transporter = null;
    }
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.sendMail({
        from: `"Cargo Consolidation" <${this.fromAddress}>`,
        to,
        subject,
        html,
      });
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
      return false;
    }
  }

  /** Build a nice HTML email from event + message */
  buildNotificationEmail(event: string, message: string): { subject: string; html: string } {
    const subjects: Record<string, string> = {
      parcel_received: 'Посылка принята на складе',
      box_packed: 'Коробка упакована',
      box_shipped: 'Коробка отправлена',
      box_delivered: 'Коробка готова к выдаче',
      payment_received: 'Оплата получена',
      storage_warning: 'Предупреждение о хранении',
    };

    const subject = subjects[event] || 'Уведомление от Cargo';

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f4f8">
<div style="max-width:480px;margin:0 auto;padding:24px">
  <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:20px">Cargo Consolidation</h1>
    </div>
    <div style="padding:24px">
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0">${message}</p>
    </div>
    <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <a href="https://cargo.tj/ru/dashboard" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600">Открыть кабинет</a>
    </div>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px">Cargo Consolidation System</p>
</div>
</body></html>`;

    return { subject, html };
  }
}
