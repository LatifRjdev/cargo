import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ParcelsService } from './parcels.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  IntakeDto,
  IntakeUnidentifiedDto,
  RejectDto,
  AssignDto,
  UploadPhotoDto,
} from './dto/intake.dto';

@ApiTags('Warehouse Parcels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('WAREHOUSE_WORKER', 'ADMIN')
@Controller('warehouse/parcels')
export class WarehouseParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Post('intake')
  intake(
    @Body() dto: IntakeDto,
    @CurrentUser('warehouseId') warehouseId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.parcelsService.intake(dto, warehouseId, userId);
  }

  @Post('intake/unidentified')
  intakeUnidentified(
    @Body() dto: IntakeUnidentifiedDto,
    @CurrentUser('warehouseId') warehouseId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.parcelsService.intakeUnidentified(dto, warehouseId, userId);
  }

  @Post(':id/photos')
  uploadPhoto(
    @Param('id') id: string,
    @Body() dto: UploadPhotoDto,
  ) {
    return this.parcelsService.uploadPhoto(id, dto.url, dto.type);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.parcelsService.reject(id, dto.reason, userId);
  }

  @Post(':id/assign')
  assign(
    @Param('id') id: string,
    @Body() dto: AssignDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.parcelsService.assignToCustomer(id, dto.customerId, userId);
  }

  @Get()
  list(
    @CurrentUser('warehouseId') warehouseId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.parcelsService.findForWarehouse(warehouseId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('unidentified')
  listUnidentified(@CurrentUser('warehouseId') warehouseId: string) {
    return this.parcelsService.findUnidentifiedForWarehouse(warehouseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parcelsService.findById(id);
  }
}
