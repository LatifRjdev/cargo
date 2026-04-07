import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePartnerDto, UpdatePartnerDto, CreatePartnerShipmentDto, UpdateShipmentStatusDto, CreateStatusMappingDto, WebhookDto } from './dto/partner.dto';

@ApiTags('Partners')
@Controller()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // ─── Admin endpoints (require auth) ────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/partners')
  list() {
    return this.partnersService.listPartners();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/partners/:id')
  getOne(@Param('id') id: string) {
    return this.partnersService.getPartner(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/partners')
  create(@Body() body: CreatePartnerDto) {
    return this.partnersService.createPartner({ ...body, integration: body.integration || 'MANUAL' });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/partners/:id')
  update(@Param('id') id: string, @Body() body: UpdatePartnerDto) {
    return this.partnersService.updatePartner(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/partners/:id/regenerate-key')
  regenerateKey(@Param('id') id: string) {
    return this.partnersService.regenerateApiKey(id);
  }

  // ─── Status Mappings ───────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/partners/:id/mappings')
  upsertMapping(@Param('id') id: string, @Body() body: CreateStatusMappingDto) {
    return this.partnersService.upsertStatusMapping(id, body.partnerStatus, body.mappedStatus);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/partners/mappings/:mappingId')
  deleteMapping(@Param('mappingId') mappingId: string) {
    return this.partnersService.deleteStatusMapping(mappingId);
  }

  // ─── Shipments ─────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/partner-shipments')
  listShipments(
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.partnersService.listShipments({
      partnerId, status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/partner-shipments')
  createShipment(@Body() body: CreatePartnerShipmentDto) {
    return this.partnersService.createShipment(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/partner-shipments/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateShipmentStatusDto) {
    return this.partnersService.updateShipmentStatus(id, body.status, { ...body, source: 'manual' });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/partner-shipments/:id/poll')
  pollStatus(@Param('id') id: string) {
    return this.partnersService.pollPartnerStatus(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('admin/partner-shipments/poll-all')
  pollAll() {
    return this.partnersService.pollAllApiPartners();
  }

  // ─── Public webhook endpoint (no auth — uses API key in header) ────────

  @Post('partner/webhook')
  webhook(
    @Headers('x-api-key') apiKey: string,
    @Body() body: WebhookDto,
  ) {
    return this.partnersService.handleWebhook(apiKey, body);
  }
}
