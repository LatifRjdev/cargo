import { PrismaClient, UserRole, WarehouseType, Currency, Marketplace, ParcelCategory, ParcelStatus, BoxStatus, BatchStatus, PaymentMethod, PaymentStatus, ExpenseScope, ExpenseCategory } from '@prisma/client';
import * as QRCode from 'qrcode';

const prisma = new PrismaClient();

const WH_GZ = '00000000-0000-0000-0000-000000000001';
const WH_UR = '00000000-0000-0000-0000-000000000002';
const WH_DB = '00000000-0000-0000-0000-000000000003';

async function main() {
  console.log('🌱 Seeding demo data...\n');

  // Clean previous demo data (keep admin + warehouses + tariffs + rates + settings + cells)
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.batchStatusLog.deleteMany();
  await prisma.boxStatusLog.deleteMany();
  await prisma.parcelStatusLog.deleteMany();
  await prisma.parcelPhoto.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.consolidationBox.deleteMany();
  await prisma.shipmentBatch.deleteMany();
  await prisma.orgTariff.deleteMany();
  await prisma.user.deleteMany({ where: { phone: { not: '+992000000000' } } });
  await prisma.organization.deleteMany();
  await prisma.storageCell.updateMany({ data: { isOccupied: false } });
  console.log('🧹 Cleaned previous demo data');

  // ─── Users (10 customers + 3 workers + 1 admin already exists) ──────────
  const customers: any[] = [];
  const customerData = [
    { phone: '+992901001001', fullName: 'Рахмонов Фирдавс', code: 'CD-0002' },
    { phone: '+992901001002', fullName: 'Каримова Нигина', code: 'CD-0003' },
    { phone: '+992901001003', fullName: 'Назаров Далер', code: 'CD-0004' },
    { phone: '+992901001004', fullName: 'Саидова Мадина', code: 'CD-0005' },
    { phone: '+992901001005', fullName: 'Ахмедов Тимур', code: 'CD-0006' },
    { phone: '+992901001006', fullName: 'Юсупова Зарина', code: 'CD-0007' },
    { phone: '+992901001007', fullName: 'Холиков Рустам', code: 'CD-0008' },
    { phone: '+992901001008', fullName: 'Мирзоева Лола', code: 'CD-0009' },
    { phone: '+992901001009', fullName: 'Шарипов Бахтиёр', code: 'CD-0010' },
    { phone: '+992901001010', fullName: 'Раджабова Фарангис', code: 'CD-0011' },
  ];

  for (const c of customerData) {
    const qr = await QRCode.toDataURL(c.code, { width: 300 });
    const user = await prisma.user.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        phone: c.phone,
        fullName: c.fullName,
        clientCode: c.code,
        qrCodeUrl: qr,
        role: UserRole.CUSTOMER,
        homeWarehouseId: WH_GZ,
      },
    });
    customers.push(user);
  }
  console.log(`✅ ${customers.length} customers created`);

  // Workers
  const workerData = [
    { phone: '+992902001001', fullName: 'Ли Вэй', warehouseId: WH_GZ },
    { phone: '+992902001002', fullName: 'Чжан Мин', warehouseId: WH_UR },
    { phone: '+992902001003', fullName: 'Алиев Сардор', warehouseId: WH_DB },
  ];

  const workers = [];
  for (const w of workerData) {
    const worker = await prisma.user.upsert({
      where: { phone: w.phone },
      update: {},
      create: {
        phone: w.phone,
        fullName: w.fullName,
        role: UserRole.WAREHOUSE_WORKER,
        warehouseId: w.warehouseId,
        clientCode: `WK-${w.phone.slice(-4)}`,
      },
    });
    workers.push(worker);
  }
  console.log(`✅ ${workers.length} workers created`);

  // ─── Organizations (2) ──────────────────────────────────────────────────
  const org1 = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000101',
      name: 'TajTrade LLC',
      bin: 'TJ-12345678',
      creditLimit: 5000,
      currentDebt: 1200,
      contactPhone: '+992372221234',
    },
  });
  const org2 = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000102' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000102',
      name: 'SilkRoad Import',
      bin: 'TJ-87654321',
      creditLimit: 10000,
      currentDebt: 0,
      contactPhone: '+992372225678',
    },
  });

  // Link first 2 customers to org
  await prisma.user.update({ where: { id: customers[0].id }, data: { organizationId: org1.id } });
  await prisma.user.update({ where: { id: customers[1].id }, data: { organizationId: org1.id } });
  await prisma.user.update({ where: { id: customers[2].id }, data: { organizationId: org2.id } });
  console.log(`✅ 2 organizations created`);

  // ─── Parcels (30 across different statuses) ─────────────────────────────
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  // Get some cells
  const cells = await prisma.storageCell.findMany({ where: { warehouseId: WH_GZ }, take: 20 });

  const parcelsData = [
    // STORED parcels (on warehouse, not yet in box) — 8
    ...Array.from({ length: 8 }, (_, i) => ({
      trackingNumber: `TB${2024030100 + i}`,
      marketplace: [Marketplace.TAOBAO, Marketplace.ALI_1688, Marketplace.PINDUODUO, Marketplace.POIZON][i % 4],
      category: [ParcelCategory.CLOTHING, ParcelCategory.ELECTRONICS, ParcelCategory.SHOES, ParcelCategory.COSMETICS, ParcelCategory.HOUSEHOLD, ParcelCategory.FOOD, ParcelCategory.OTHER, ParcelCategory.CLOTHING][i],
      description: ['Куртка мужская зимняя', 'Наушники Bluetooth TWS', 'Кроссовки Nike Air Max', 'Набор корейской косметики', 'Пылесос робот', 'Чай зелёный 500г', 'Чехлы для iPhone', 'Платье женское'][i],
      weightKg: [1.2, 0.3, 0.8, 0.5, 3.5, 0.7, 0.2, 0.4][i],
      lengthCm: [40, 15, 35, 25, 45, 20, 10, 30][i],
      widthCm: [30, 10, 25, 20, 35, 15, 8, 25][i],
      heightCm: [10, 8, 15, 10, 20, 10, 5, 8][i],
      customerId: customers[i % customers.length].id,
      status: ParcelStatus.STORED,
      receivedAt: daysAgo(Math.floor(Math.random() * 10) + 1),
      cellId: cells[i]?.id,
    })),
    // RECEIVED parcels (just arrived today) — 5
    ...Array.from({ length: 5 }, (_, i) => ({
      trackingNumber: `PDD${2024040100 + i}`,
      marketplace: Marketplace.PINDUODUO,
      category: [ParcelCategory.ELECTRONICS, ParcelCategory.CLOTHING, ParcelCategory.SHOES, ParcelCategory.COSMETICS, ParcelCategory.HOUSEHOLD][i],
      description: ['Планшет 10 дюймов', 'Джинсы Levis', 'Сандалии летние', 'Шампунь Kerastase', 'Термос 1л'][i],
      weightKg: [0.6, 0.5, 0.4, 0.3, 0.8][i],
      lengthCm: [25, 30, 30, 20, 30][i],
      widthCm: [18, 20, 20, 10, 10][i],
      heightCm: [2, 5, 12, 8, 30][i],
      customerId: customers[(i + 3) % customers.length].id,
      status: ParcelStatus.RECEIVED,
      receivedAt: daysAgo(0),
      cellId: cells[8 + i]?.id,
    })),
    // WAITING parcels (customer added tracking, not yet arrived) — 5
    ...Array.from({ length: 5 }, (_, i) => ({
      trackingNumber: `SF${7890120 + i}`,
      marketplace: [Marketplace.TAOBAO, Marketplace.ALI_1688, Marketplace.POIZON, Marketplace.TAOBAO, Marketplace.OTHER][i],
      category: null,
      description: null,
      weightKg: 0,
      lengthCm: 0,
      widthCm: 0,
      heightCm: 0,
      customerId: customers[(i + 5) % customers.length].id,
      status: ParcelStatus.WAITING,
      receivedAt: null,
      cellId: null,
    })),
    // IN_BOX (will be linked to boxes below) — 12
    ...Array.from({ length: 12 }, (_, i) => ({
      trackingNumber: `ALI${3000100 + i}`,
      marketplace: [Marketplace.ALI_1688, Marketplace.TAOBAO, Marketplace.PINDUODUO][i % 3],
      category: [ParcelCategory.CLOTHING, ParcelCategory.ELECTRONICS, ParcelCategory.SHOES, ParcelCategory.COSMETICS, ParcelCategory.HOUSEHOLD, ParcelCategory.OTHER][i % 6],
      description: ['Рубашка', 'Зарядка USB-C', 'Ботинки', 'Крем для лица', 'Кухонные весы', 'Ремень кожаный', 'Свитер', 'Наушники', 'Тапочки', 'Маска для лица', 'Лампа настольная', 'Кошелёк'][i],
      weightKg: [0.3, 0.1, 1.0, 0.2, 0.5, 0.3, 0.4, 0.15, 0.3, 0.1, 1.2, 0.2][i],
      lengthCm: 20, widthCm: 15, heightCm: 10,
      customerId: customers[i % 6].id,
      status: ParcelStatus.IN_BOX,
      receivedAt: daysAgo(15 + i),
      cellId: null,
    })),
  ];

  const createdParcels = [];
  for (const p of parcelsData) {
    const parcel = await prisma.parcel.create({
      data: {
        trackingNumber: p.trackingNumber,
        marketplace: p.marketplace,
        category: p.category,
        description: p.description,
        weightKg: p.weightKg,
        lengthCm: p.lengthCm,
        widthCm: p.widthCm,
        heightCm: p.heightCm,
        customerId: p.customerId,
        warehouseId: WH_GZ,
        status: p.status,
        receivedAt: p.receivedAt,
        cellId: p.cellId,
        isUnidentified: false,
      },
    });
    // Status log
    await prisma.parcelStatusLog.create({ data: { parcelId: parcel.id, status: p.status, comment: 'Seed data' } });
    createdParcels.push(parcel);
  }

  // Mark occupied cells
  for (const p of parcelsData) {
    if (p.cellId) {
      await prisma.storageCell.update({ where: { id: p.cellId }, data: { isOccupied: true } });
    }
  }

  // 2 unidentified parcels
  for (let i = 0; i < 2; i++) {
    await prisma.parcel.create({
      data: {
        trackingNumber: `UNK${9990 + i}`,
        warehouseId: WH_GZ,
        status: ParcelStatus.RECEIVED,
        isUnidentified: true,
        phoneOnLabel: `+86138000${1000 + i}`,
        weightKg: 0.5 + i * 0.3,
        lengthCm: 20, widthCm: 15, heightCm: 10,
        receivedAt: daysAgo(2),
      },
    });
  }

  console.log(`✅ ${createdParcels.length + 2} parcels created`);

  // ─── Consolidation Boxes (8) ────────────────────────────────────────────
  const inBoxParcels = createdParcels.filter(p => p.status === 'IN_BOX');
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const boxesData = [
    // DELIVERED boxes (2) — complete flow
    { code: `BX-${datePrefix}-0001`, customerId: customers[0].id, status: BoxStatus.DELIVERED, weight: 2.1, price: 17.85, parcels: inBoxParcels.slice(0, 2) },
    { code: `BX-${datePrefix}-0002`, customerId: customers[1].id, status: BoxStatus.DELIVERED, weight: 1.5, price: 12.75, parcels: inBoxParcels.slice(2, 4) },
    // READY boxes (2) — at destination, waiting pickup
    { code: `BX-${datePrefix}-0003`, customerId: customers[2].id, status: BoxStatus.READY, weight: 3.2, price: 27.20, parcels: inBoxParcels.slice(4, 6) },
    { code: `BX-${datePrefix}-0004`, customerId: customers[3].id, status: BoxStatus.READY, weight: 1.8, price: 15.30, parcels: inBoxParcels.slice(6, 7) },
    // IN_TRANSIT (2) — on the way
    { code: `BX-${datePrefix}-0005`, customerId: customers[4].id, status: BoxStatus.IN_TRANSIT, weight: 2.5, price: 21.25, parcels: inBoxParcels.slice(7, 9) },
    { code: `BX-${datePrefix}-0006`, customerId: customers[5].id, status: BoxStatus.IN_TRANSIT, weight: 1.2, price: 10.20, parcels: inBoxParcels.slice(9, 10) },
    // PACKED (1) — packed, waiting for shipment
    { code: `BX-${datePrefix}-0007`, customerId: customers[0].id, status: BoxStatus.PACKED, weight: 0.9, price: 15.00, parcels: inBoxParcels.slice(10, 11) },
    // REQUESTED (1) — customer just requested
    { code: `BX-${datePrefix}-0008`, customerId: customers[6].id, status: BoxStatus.REQUESTED, weight: null, price: null, parcels: inBoxParcels.slice(11, 12) },
  ];

  const createdBoxes = [];
  for (const b of boxesData) {
    const box = await prisma.consolidationBox.create({
      data: {
        boxCode: b.code,
        customerId: b.customerId,
        warehouseId: WH_GZ,
        status: b.status,
        weightKg: b.weight,
        billableWeight: b.weight,
        finalPrice: b.price,
        estimatedPrice: b.price ? b.price * 0.9 : null,
        currency: Currency.USD,
        customerNote: b.status === 'REQUESTED' ? 'Пожалуйста упакуйте аккуратно, хрупкие вещи' : null,
        shelfLocation: b.status === 'READY' ? `Полка ${Math.floor(Math.random() * 10) + 1}` : null,
      },
    });
    // Link parcels
    for (const p of b.parcels) {
      await prisma.parcel.update({ where: { id: p.id }, data: { boxId: box.id } });
    }
    // Status log
    const statuses: BoxStatus[] = [];
    if (['REQUESTED', 'PACKED', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'READY', 'DELIVERED'].includes(b.status)) statuses.push(BoxStatus.REQUESTED);
    if (['PACKED', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'READY', 'DELIVERED'].includes(b.status)) statuses.push(BoxStatus.PACKED);
    if (['IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'READY', 'DELIVERED'].includes(b.status)) statuses.push(BoxStatus.IN_TRANSIT);
    if (['CUSTOMS', 'ARRIVED', 'READY', 'DELIVERED'].includes(b.status)) statuses.push(BoxStatus.CUSTOMS);
    if (['ARRIVED', 'READY', 'DELIVERED'].includes(b.status)) statuses.push(BoxStatus.ARRIVED);
    if (['READY', 'DELIVERED'].includes(b.status)) statuses.push(BoxStatus.READY);
    if (b.status === 'DELIVERED') statuses.push(BoxStatus.DELIVERED);

    for (let si = 0; si < statuses.length; si++) {
      await prisma.boxStatusLog.create({
        data: { boxId: box.id, status: statuses[si], createdAt: daysAgo(20 - si * 3), comment: si === 0 ? 'Заявка клиента' : undefined },
      });
    }
    createdBoxes.push(box);
  }
  console.log(`✅ ${createdBoxes.length} boxes created`);

  // ─── Shipment Batches (3) ───────────────────────────────────────────────
  const batch1 = await prisma.shipmentBatch.create({
    data: {
      batchCode: `SH-${datePrefix}-001`,
      route: 'Гуанчжоу → Урумчи → Душанбе',
      vehicleNumber: 'АА 777 TJ',
      status: BatchStatus.COMPLETED,
      totalBoxes: 2,
      totalWeight: 3.6,
      departedAt: daysAgo(14),
      arrivedAt: daysAgo(2),
    },
  });
  // Link delivered + ready boxes to completed batch
  await prisma.consolidationBox.update({ where: { id: createdBoxes[0].id }, data: { batchId: batch1.id } });
  await prisma.consolidationBox.update({ where: { id: createdBoxes[1].id }, data: { batchId: batch1.id } });
  await prisma.consolidationBox.update({ where: { id: createdBoxes[2].id }, data: { batchId: batch1.id } });
  await prisma.consolidationBox.update({ where: { id: createdBoxes[3].id }, data: { batchId: batch1.id } });

  const batch2 = await prisma.shipmentBatch.create({
    data: {
      batchCode: `SH-${datePrefix}-002`,
      route: 'Гуанчжоу → Душанбе',
      vehicleNumber: 'ВВ 123 TJ',
      status: BatchStatus.DEPARTED,
      totalBoxes: 2,
      totalWeight: 3.7,
      departedAt: daysAgo(3),
    },
  });
  await prisma.consolidationBox.update({ where: { id: createdBoxes[4].id }, data: { batchId: batch2.id } });
  await prisma.consolidationBox.update({ where: { id: createdBoxes[5].id }, data: { batchId: batch2.id } });

  const batch3 = await prisma.shipmentBatch.create({
    data: {
      batchCode: `SH-${datePrefix}-003`,
      route: 'Гуанчжоу → Урумчи → Душанбе',
      vehicleNumber: null,
      status: BatchStatus.FORMING,
      totalBoxes: 0,
    },
  });

  // Batch status logs
  for (const [batch, statuses] of [
    [batch1, [BatchStatus.FORMING, BatchStatus.DEPARTED, BatchStatus.CUSTOMS, BatchStatus.ARRIVED, BatchStatus.COMPLETED]],
    [batch2, [BatchStatus.FORMING, BatchStatus.DEPARTED]],
    [batch3, [BatchStatus.FORMING]],
  ] as const) {
    for (let i = 0; i < statuses.length; i++) {
      await prisma.batchStatusLog.create({
        data: { batchId: batch.id, status: statuses[i], createdAt: daysAgo(20 - i * 4) },
      });
    }
  }
  console.log(`✅ 3 shipment batches created`);

  // ─── Payments (2 for delivered boxes) ───────────────────────────────────
  await prisma.payment.create({
    data: {
      boxId: createdBoxes[0].id,
      customerId: customers[0].id,
      collectedById: workers[2].id,
      method: PaymentMethod.CASH,
      status: PaymentStatus.COMPLETED,
      amount: 17.85,
      currency: Currency.USD,
      exchangeRate: 10.93,
      paidAt: daysAgo(1),
    },
  });
  await prisma.payment.create({
    data: {
      boxId: createdBoxes[1].id,
      customerId: customers[1].id,
      collectedById: workers[2].id,
      method: PaymentMethod.TRANSFER,
      status: PaymentStatus.COMPLETED,
      amount: 12.75,
      currency: Currency.USD,
      paidAt: daysAgo(1),
    },
  });
  console.log(`✅ 2 payments created`);

  // ─── Expenses (8) ──────────────────────────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { phone: '+992000000000' } });
  const expensesData = [
    { scope: ExpenseScope.BATCH, category: ExpenseCategory.TRANSPORT, amount: 450, description: 'Фура Гуанчжоу-Душанбе', batchId: batch1.id },
    { scope: ExpenseScope.BATCH, category: ExpenseCategory.CUSTOMS, amount: 120, description: 'Таможенные сборы рейс 1', batchId: batch1.id },
    { scope: ExpenseScope.BATCH, category: ExpenseCategory.TRANSPORT, amount: 380, description: 'Контейнер Гуанчжоу-Душанбе', batchId: batch2.id },
    { scope: ExpenseScope.BOX, category: ExpenseCategory.PACKAGING, amount: 5, description: 'Упаковочная плёнка', boxId: createdBoxes[0].id },
    { scope: ExpenseScope.BOX, category: ExpenseCategory.INSURANCE, amount: 8, description: 'Страховка хрупкого', boxId: createdBoxes[2].id },
    { scope: ExpenseScope.GENERAL, category: ExpenseCategory.WAREHOUSE_RENT, amount: 800, description: 'Аренда склада Гуанчжоу (март)' },
    { scope: ExpenseScope.GENERAL, category: ExpenseCategory.LABOR, amount: 1200, description: 'Зарплата работников (март)' },
    { scope: ExpenseScope.GENERAL, category: ExpenseCategory.FUEL, amount: 150, description: 'Топливо для доставок' },
  ];

  for (const e of expensesData) {
    await prisma.expense.create({
      data: {
        scope: e.scope,
        category: e.category,
        amount: e.amount,
        currency: Currency.USD,
        description: e.description,
        boxId: (e as any).boxId,
        batchId: (e as any).batchId,
        createdById: admin!.id,
      },
    });
  }
  console.log(`✅ ${expensesData.length} expenses created`);

  // ─── Audit Log (5 entries) ──────────────────────────────────────────────
  const auditEntries = [
    { action: 'PARCEL_INTAKE', entityType: 'Parcel', entityId: createdParcels[0].id },
    { action: 'BOX_PACKED', entityType: 'Box', entityId: createdBoxes[0].id },
    { action: 'BATCH_DEPARTED', entityType: 'Batch', entityId: batch1.id },
    { action: 'PAYMENT_COLLECTED', entityType: 'Payment', entityId: createdBoxes[0].id },
    { action: 'USER_CREATED', entityType: 'User', entityId: customers[0].id },
  ];
  for (const a of auditEntries) {
    await prisma.auditLog.create({
      data: { userId: admin!.id, action: a.action, entityType: a.entityType, entityId: a.entityId },
    });
  }
  console.log(`✅ ${auditEntries.length} audit entries created`);

  // ─── Notifications (5) ─────────────────────────────────────────────────
  for (let i = 0; i < 5; i++) {
    await prisma.notification.create({
      data: {
        userId: customers[i].id,
        channel: 'WEB',
        event: ['parcel_received', 'box_packed', 'box_shipped', 'box_arrived', 'box_ready'][i],
        message: ['Ваша посылка получена на складе', 'Ваша коробка упакована', 'Ваша коробка отправлена', 'Ваша коробка прибыла', 'Ваша коробка готова к выдаче'][i],
        status: 'SENT',
      },
    });
  }
  console.log(`✅ 5 notifications created`);

  // ─── Settings (prohibited items) ───────────────────────────────────────
  await prisma.setting.upsert({
    where: { key: 'prohibited_items' },
    update: {},
    create: {
      key: 'prohibited_items',
      value: JSON.stringify(['Батарейки литиевые', 'Оружие', 'Наркотики', 'Порох', 'Жидкости горючие', 'Животные']),
      label: 'Запрещённые товары',
    },
  });
  console.log(`✅ Prohibited items setting created`);

  console.log('\n🎉 Demo data seeding complete!\n');
  console.log('📋 Test accounts:');
  console.log('   Admin:    +992000000000 (OTP: 0000)');
  console.log('   Customer: +992901001001 (OTP: 0000) — Рахмонов Фирдавс');
  console.log('   Customer: +992901001002 (OTP: 0000) — Каримова Нигина');
  console.log('   Worker:   +992902001001 (OTP: 0000) — Ли Вэй (Гуанчжоу)');
  console.log('   Worker:   +992902001003 (OTP: 0000) — Алиев Сардор (Душанбе)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
