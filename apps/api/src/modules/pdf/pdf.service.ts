import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import PDFDocument = require('pdfkit');
import * as QRCode from 'qrcode';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService) {}

  // ─── Box Label PDF ────────────────────────────────────────────────────────

  async boxLabel(boxId: string): Promise<Buffer> {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: {
        customer: { select: { fullName: true, clientCode: true, phone: true } },
        warehouse: { select: { name: true, address: true } },
        parcels: { select: { id: true } },
      },
    });

    if (!box) throw new NotFoundException('Box not found');

    const qrDataUrl = await QRCode.toDataURL(box.boxCode, { width: 150 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [283, 425], margin: 20 }); // ~100x150mm label
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // QR code
      doc.image(qrBuffer, 67, 10, { width: 150 });

      // Box code
      doc.fontSize(18).font('Helvetica-Bold').text(box.boxCode, 0, 170, { align: 'center' });

      // Customer
      doc.fontSize(10).font('Helvetica');
      doc.text(`Customer: ${box.customer?.clientCode || '—'} / ${box.customer?.fullName || '—'}`, 20, 200);

      // Route
      doc.text(`From: ${box.warehouse?.name || '—'}`, 20, 220);
      doc.text(`Weight: ${box.weightKg ? Number(box.weightKg).toFixed(2) + ' kg' : '—'}`, 20, 240);
      doc.text(`Parcels: ${box.parcels.length}`, 20, 260);

      // Price
      if (box.finalPrice) {
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`$${Number(box.finalPrice).toFixed(2)}`, 0, 290, { align: 'center' });
      }

      doc.end();
    });
  }

  // ─── Shipment Manifest PDF ────────────────────────────────────────────────

  async shipmentManifest(batchId: string): Promise<Buffer> {
    const batch = await this.prisma.shipmentBatch.findUnique({
      where: { id: batchId },
      include: {
        boxes: {
          include: {
            customer: { select: { fullName: true, clientCode: true } },
          },
        },
      },
    });

    if (!batch) throw new NotFoundException('Batch not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(16).font('Helvetica-Bold').text('Shipment Manifest', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Batch: ${batch.batchCode}`);
      doc.text(`Route: ${batch.route}`);
      doc.text(`Vehicle: ${batch.vehicleNumber || '—'}`);
      doc.text(`Total boxes: ${batch.totalBoxes}`);
      doc.text(`Total weight: ${batch.totalWeight ? Number(batch.totalWeight).toFixed(2) + ' kg' : '—'}`);
      doc.text(`Date: ${batch.createdAt.toLocaleDateString('ru-RU')}`);
      doc.moveDown();

      // Table header
      const tableTop = doc.y;
      const col = [40, 140, 280, 380, 450];
      doc.font('Helvetica-Bold').fontSize(9);
      doc.text('#', col[0], tableTop);
      doc.text('Box Code', col[1], tableTop);
      doc.text('Customer', col[2], tableTop);
      doc.text('Weight', col[3], tableTop);
      doc.text('Price', col[4], tableTop);
      doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

      // Rows
      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 20;
      batch.boxes.forEach((box, i) => {
        if (y > 750) {
          doc.addPage();
          y = 40;
        }
        doc.text(`${i + 1}`, col[0], y);
        doc.text(box.boxCode, col[1], y);
        doc.text(`${box.customer?.clientCode || ''} ${box.customer?.fullName || ''}`, col[2], y, { width: 90 });
        doc.text(box.billableWeight ? `${Number(box.billableWeight).toFixed(2)}` : '—', col[3], y);
        doc.text(box.finalPrice ? `$${Number(box.finalPrice).toFixed(2)}` : '—', col[4], y);
        y += 18;
      });

      doc.end();
    });
  }

  // ─── Payment Receipt PDF ──────────────────────────────────────────────────

  async paymentReceipt(boxId: string): Promise<Buffer> {
    const box = await this.prisma.consolidationBox.findUnique({
      where: { id: boxId },
      include: {
        customer: { select: { fullName: true, clientCode: true, phone: true } },
        payment: true,
      },
    });

    if (!box) throw new NotFoundException('Box not found');
    if (!box.payment) throw new NotFoundException('No payment for this box');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: [283, 400], margin: 20 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(14).font('Helvetica-Bold').text('Payment Receipt', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).font('Helvetica');
      doc.text(`Box: ${box.boxCode}`);
      doc.text(`Customer: ${box.customer?.clientCode} / ${box.customer?.fullName}`);
      doc.text(`Phone: ${box.customer?.phone || '—'}`);
      doc.moveDown(0.5);

      const pay = box.payment!;
      doc.text(`Amount: ${Number(pay.amount).toFixed(2)} ${pay.currency}`);
      doc.text(`Method: ${pay.method}`);
      doc.text(`Date: ${pay.paidAt ? new Date(pay.paidAt).toLocaleString('ru-RU') : '—'}`);

      if (pay.exchangeRate) {
        doc.text(`Exchange rate: ${Number(pay.exchangeRate).toFixed(4)}`);
      }

      doc.moveDown();
      doc.fontSize(8).text('Thank you for using Cargo Consolidation!', { align: 'center' });

      doc.end();
    });
  }

  // ─── QR Code PDF (customer instructions) ──────────────────────────────────

  async customerQrPdf(userId: string): Promise<Buffer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.clientCode) throw new NotFoundException('User not found');

    const qrDataUrl = await QRCode.toDataURL(user.clientCode, { width: 200 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const warehouses = await this.prisma.warehouse.findMany({
      where: { isActive: true, type: 'ORIGIN' },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').text('Your Client Code', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(24).text(user.clientCode!, { align: 'center' });
      doc.moveDown();

      // QR
      doc.image(qrBuffer, (doc.page.width - 200) / 2, doc.y, { width: 200 });
      doc.moveDown(10);

      doc.fontSize(10).font('Helvetica');
      doc.text('Show this QR code to the warehouse worker when sending your parcels.');
      doc.moveDown();

      if (warehouses.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('Warehouse Addresses:');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        for (const wh of warehouses) {
          doc.text(`${wh.name}`);
          doc.text(`${wh.address || ''}`);
          if (wh.phone) doc.text(`Tel: ${wh.phone}`);
          doc.moveDown(0.5);
        }
      }

      doc.end();
    });
  }
}
