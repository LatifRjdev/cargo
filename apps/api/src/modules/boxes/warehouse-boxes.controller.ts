import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BoxesService } from './boxes.service';
import { PackBoxDto } from './dto/build-box.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Warehouse Boxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WAREHOUSE_WORKER', 'ADMIN')
@Controller('warehouse/boxes')
export class WarehouseBoxesController {
  constructor(private readonly boxesService: BoxesService) {}

  @Get('queue')
  packingQueue(@CurrentUser('warehouseId') warehouseId: string) {
    return this.boxesService.getPackingQueue(warehouseId);
  }

  @Post(':id/pack')
  pack(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') workerId: string,
    @Body() dto: PackBoxDto,
  ) {
    return this.boxesService.packBox(id, workerId, dto);
  }
}
