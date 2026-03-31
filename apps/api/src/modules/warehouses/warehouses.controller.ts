import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Warehouses')
@Controller()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get('warehouses')
  list() {
    return this.warehousesService.findAll();
  }

  // ─── Cell Management (Worker/Admin) ───────────────────────────────────────

  @Get('warehouse/cells')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_WORKER')
  getCells(@Query('warehouseId') warehouseId: string) {
    return this.warehousesService.findCells(warehouseId);
  }

  @Post('warehouse/cells')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_WORKER')
  createCell(@Body() body: { warehouseId: string; code: string }) {
    return this.warehousesService.createCell(body.warehouseId, body.code);
  }

  @Post('warehouse/cells/batch')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCellsBatch(@Body() body: { warehouseId: string; prefix: string; count: number }) {
    return this.warehousesService.createCellsBatch(body.warehouseId, body.prefix, body.count);
  }

  @Delete('warehouse/cells/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCell(@Param('id') id: string) {
    return this.warehousesService.deleteCell(id);
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  @Get('warehouse/inventory')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_WORKER')
  inventory(
    @Query('warehouseId') warehouseId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.warehousesService.inventory(warehouseId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ─── Long storage parcels ─────────────────────────────────────────────────

  @Get('warehouse/long-storage')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_WORKER')
  longStorage(
    @Query('warehouseId') warehouseId: string,
    @Query('days') days?: string,
  ) {
    return this.warehousesService.findLongStorageParcels(
      warehouseId,
      days ? parseInt(days, 10) : 30,
    );
  }
}
