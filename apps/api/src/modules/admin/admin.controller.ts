import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  dashboard() {
    return this.adminService.getDashboard();
  }

  @Get('dashboard/trends')
  dashboardTrends(@Query('days') days?: string) {
    return this.adminService.getDashboardTrends(days ? parseInt(days, 10) : 14);
  }

  // ─── Global Search ────────────────────────────────────────────────────────

  @Get('search')
  search(@Query('q') q: string) {
    return this.adminService.search(q || '');
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  @Get('users')
  listUsers(
    @Query('role') role?: string,
    @Query('active') active?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers({
      role,
      isActive: active !== undefined ? active === 'true' : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/role')
  updateRole(
    @Param('id') id: string,
    @Body() body: { role: string; warehouseId?: string },
  ) {
    return this.adminService.updateUserRole(id, body.role, body.warehouseId);
  }

  @Patch('users/:id/block')
  toggleActive(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.toggleUserActive(id, body.isActive);
  }

  @Post('users')
  createWorker(@Body() body: { fullName: string; phone: string; role: string; warehouseId?: string }) {
    return this.adminService.createWorker(body);
  }

  // ─── Tariffs ──────────────────────────────────────────────────────────────

  @Get('tariffs')
  listTariffs() {
    return this.adminService.listTariffs();
  }

  @Post('tariffs')
  upsertTariff(@Body() body: any) {
    return this.adminService.upsertTariff(body);
  }

  // ─── Warehouses ───────────────────────────────────────────────────────────

  @Get('warehouses')
  listWarehouses() {
    return this.adminService.listWarehouses();
  }

  @Post('warehouses')
  upsertWarehouse(@Body() body: any) {
    return this.adminService.upsertWarehouse(body);
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  updateSetting(@Body() body: { key: string; value: string }) {
    return this.adminService.updateSetting(body.key, body.value);
  }

  // ─── Prohibited Items ─────────────────────────────────────────────────────

  @Get('prohibited-items')
  getProhibitedItems() {
    return this.adminService.getProhibitedItems();
  }

  @Post('prohibited-items')
  addProhibitedItem(@Body() body: { item: string }) {
    return this.adminService.addProhibitedItem(body.item);
  }

  @Delete('prohibited-items')
  removeProhibitedItem(@Body() body: { item: string }) {
    return this.adminService.removeProhibitedItem(body.item);
  }

  // ─── Unidentified Parcels ──────────────────────────────────────────────────

  @Get('unidentified-parcels')
  listUnidentifiedParcels() {
    return this.adminService.listUnidentifiedParcels();
  }

  // ─── Audit Log ────────────────────────────────────────────────────────────

  @Get('audit-log')
  auditLog(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLog({
      userId,
      action,
      entityType,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  // ─── Reports ────────────────────────────────────────────────────────────────

  @Get('reports/revenue')
  revenueReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.adminService.revenueReport({ from, to, warehouseId });
  }

  @Get('reports/parcels')
  parcelsReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('marketplace') marketplace?: string,
  ) {
    return this.adminService.parcelsReport({ from, to, warehouseId, marketplace });
  }

  @Get('reports/delivery-time')
  deliveryTimeReport() {
    return this.adminService.deliveryTimeReport();
  }

  @Get('reports/debts')
  debtsReport() {
    return this.adminService.debtsReport();
  }

  @Get('reports/marketplaces')
  marketplacesReport() {
    return this.adminService.marketplacesReport();
  }

  @Get('reports/storage')
  storageReport(@Query('minDays') minDays?: string) {
    return this.adminService.storageReport(minDays ? parseInt(minDays, 10) : 30);
  }

  @Get('reports/categories')
  categoriesReport() {
    return this.adminService.categoriesReport();
  }

  @Get('reports/export/:type')
  async exportCsv(
    @Param('type') type: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.exportReportCsv(type, { from: from || '', to: to || '' });
  }

  @Get('credit-check/:userId')
  checkCredit(@Param('userId') userId: string) {
    return this.adminService.checkCreditLimit(userId);
  }

  // ─── Admin Actions ──────────────────────────────────────────────────────────

  @Post('notifications/broadcast')
  broadcast(@Body() body: { message: string; target: 'all' | 'warehouse' | 'selected'; userIds?: string[]; warehouseId?: string }) {
    return this.adminService.broadcastNotification(body.message, body.target, body.userIds, body.warehouseId);
  }

  @Get('boxes')
  listBoxes(@Query() query: { status?: string; page?: string; limit?: string }) {
    return this.adminService.listBoxes(query);
  }

  @Patch('boxes/:id/price')
  overridePrice(
    @Param('id') id: string,
    @Body() body: { price: number },
  ) {
    return this.adminService.overrideBoxPrice(id, body.price);
  }

  // ─── Organizations (B2B) ────────────────────────────────────────────────────

  @Get('organizations')
  listOrganizations() {
    return this.adminService.listOrganizations();
  }

  @Get('organizations/:id')
  getOrganization(@Param('id') id: string) {
    return this.adminService.getOrganization(id);
  }

  @Post('organizations')
  upsertOrganization(@Body() body: any) {
    return this.adminService.upsertOrganization(body);
  }

  @Post('organizations/:id/members')
  addOrgMember(
    @Param('id') orgId: string,
    @Body() body: { userId: string },
  ) {
    return this.adminService.addOrgMember(orgId, body.userId);
  }

  @Delete('organizations/:orgId/members/:userId')
  removeOrgMember(@Param('userId') userId: string) {
    return this.adminService.removeOrgMember(userId);
  }

  @Post('organizations/:id/tariffs')
  upsertOrgTariff(
    @Param('id') orgId: string,
    @Body() body: { tariffId: string; ratePerKg?: number; discountPct?: number },
  ) {
    return this.adminService.upsertOrgTariff({
      organizationId: orgId,
      ...body,
    });
  }

  @Delete('organizations/:orgId/tariffs/:tariffId')
  deleteOrgTariff(
    @Param('orgId') orgId: string,
    @Param('tariffId') tariffId: string,
  ) {
    return this.adminService.deleteOrgTariff(orgId, tariffId);
  }

  // ─── Customer Analytics ────────────────────────────────────────────────────

  @Get('analytics/customers')
  customerAnalytics() {
    return this.adminService.getCustomerAnalytics();
  }

  // ─── Bulk Import ──────────────────────────────────────────────────────────

  @Post('import/parcels')
  bulkImportParcels(@Body() body: { csv: string; warehouseId: string }) {
    return this.adminService.bulkImportParcels(body.csv, body.warehouseId);
  }
}
