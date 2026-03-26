import { Module } from '@nestjs/common';
import { CustomerParcelsController } from './customer-parcels.controller';
import { WarehouseParcelsController } from './warehouse-parcels.controller';
import { ParcelsService } from './parcels.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CustomerParcelsController, WarehouseParcelsController],
  providers: [ParcelsService],
  exports: [ParcelsService],
})
export class ParcelsModule {}
