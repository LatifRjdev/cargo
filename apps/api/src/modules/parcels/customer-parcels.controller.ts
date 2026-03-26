import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ParcelsService } from './parcels.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AddTrackingDto } from './dto/intake.dto';

@ApiTags('Customer Parcels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/parcels')
export class CustomerParcelsController {
  constructor(private readonly parcelsService: ParcelsService) {}

  @Get()
  list(
    @CurrentUser('id') customerId: string,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.parcelsService.findForCustomer(customerId, {
      status,
      warehouseId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post()
  addTracking(
    @CurrentUser('id') customerId: string,
    @Body() dto: AddTrackingDto,
  ) {
    return this.parcelsService.addTrackingNumber(customerId, dto);
  }

  @Get('unidentified')
  listUnidentified(@CurrentUser('id') customerId: string) {
    return this.parcelsService.findUnidentifiedForCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parcelsService.findById(id);
  }

  @Post(':id/claim')
  claim(
    @Param('id') id: string,
    @CurrentUser('id') customerId: string,
  ) {
    return this.parcelsService.claimParcel(id, customerId);
  }
}
