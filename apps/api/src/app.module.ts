import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ParcelsModule } from './modules/parcels/parcels.module';
import { BoxesModule } from './modules/boxes/boxes.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { TariffsModule } from './modules/tariffs/tariffs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { PickupModule } from './modules/pickup/pickup.module';
import { ExchangeRatesModule } from './modules/exchange-rates/exchange-rates.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { AdminModule } from './modules/admin/admin.module';
import { CronModule } from './modules/cron/cron.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    ParcelsModule,
    BoxesModule,
    WarehousesModule,
    TariffsModule,
    NotificationsModule,
    ExpensesModule,
    ShipmentsModule,
    PickupModule,
    ExchangeRatesModule,
    PdfModule,
    AdminModule,
    CronModule,
    UploadModule,
  ],
})
export class AppModule {}
