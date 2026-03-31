import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('PDF')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Get('warehouse/boxes/:id/label')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_WORKER')
  async boxLabel(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.pdfService.boxLabel(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="label-${id}.pdf"`,
    });
    res.send(buffer);
  }

  @Get('shipments/:id/manifest')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_WORKER')
  async shipmentManifest(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.pdfService.shipmentManifest(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="manifest-${id}.pdf"`,
    });
    res.send(buffer);
  }

  @Get('pickup/:boxId/receipt')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'WAREHOUSE_WORKER')
  async paymentReceipt(@Param('boxId') boxId: string, @Res() res: Response) {
    const buffer = await this.pdfService.paymentReceipt(boxId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="receipt-${boxId}.pdf"`,
    });
    res.send(buffer);
  }

}
