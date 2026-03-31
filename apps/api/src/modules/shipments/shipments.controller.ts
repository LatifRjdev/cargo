import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateShipmentDto, AddBoxesDto, UpdateStatusDto } from './dto/shipment.dto';

@ApiTags('Shipments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'WAREHOUSE_WORKER')
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.create(dto, userId);
  }

  @Get('available-boxes')
  availableBoxes() {
    return this.shipmentsService.findAvailableBoxes();
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.shipmentsService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findById(id);
  }

  @Post(':id/boxes')
  addBoxes(
    @Param('id') id: string,
    @Body() dto: AddBoxesDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.addBoxes(id, dto.boxIds, userId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.shipmentsService.updateStatus(id, dto.status, dto.comment, userId);
  }
}
