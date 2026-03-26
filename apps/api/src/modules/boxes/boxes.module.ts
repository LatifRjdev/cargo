import { Module } from '@nestjs/common';
import { CustomerBoxesController } from './customer-boxes.controller';
import { WarehouseBoxesController } from './warehouse-boxes.controller';
import { BoxesService } from './boxes.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CustomerBoxesController, WarehouseBoxesController],
  providers: [BoxesService],
  exports: [BoxesService],
})
export class BoxesModule {}
