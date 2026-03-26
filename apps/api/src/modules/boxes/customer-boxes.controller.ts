import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BoxesService } from './boxes.service';
import { BuildBoxDto } from './dto/build-box.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customer Boxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/boxes')
export class CustomerBoxesController {
  constructor(private readonly boxesService: BoxesService) {}

  @Post()
  buildBox(@CurrentUser('id') customerId: string, @Body() dto: BuildBoxDto) {
    return this.boxesService.buildBox(customerId, dto);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @CurrentUser('id') customerId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.boxesService.findForCustomer(customerId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') customerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boxesService.findById(id);
  }

  @Delete(':id')
  cancel(
    @CurrentUser('id') customerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boxesService.cancelBox(id, customerId);
  }
}
