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
import { PickupService } from './pickup.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PayDto } from './dto/pickup.dto';

@ApiTags('Pickup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'WORKER')
@Controller('pickup')
export class PickupController {
  constructor(private readonly pickupService: PickupService) {}

  @Get('pending')
  pending() {
    return this.pickupService.findPending();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.pickupService.search(q || '');
  }

  @Post(':boxId/pay')
  pay(
    @Param('boxId') boxId: string,
    @Body() dto: PayDto,
    @CurrentUser('id') workerId: string,
  ) {
    return this.pickupService.pay(boxId, dto, workerId);
  }

  @Post(':boxId/deliver')
  deliver(
    @Param('boxId') boxId: string,
    @CurrentUser('id') workerId: string,
  ) {
    return this.pickupService.deliver(boxId, workerId);
  }
}
