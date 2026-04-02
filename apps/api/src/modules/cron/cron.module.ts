import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [NotificationsModule, PartnersModule],
  providers: [CronService],
})
export class CronModule {}
