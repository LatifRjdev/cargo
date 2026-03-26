import { PrismaClient, WarehouseType, Currency, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Warehouses ──────────────────────────────────────────────────────────
  const guangzhou = await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Гуанчжоу',
      type: WarehouseType.ORIGIN,
      address: 'Guangzhou, Baiyun District, Warehouse 88, Unit 3',
      phone: '+86-20-1234-5678',
    },
  });

  const urumqi = await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Урумчи',
      type: WarehouseType.TRANSIT,
      address: 'Urumqi, Xinshi District, Logistics Park 12',
      phone: '+86-991-1234-5678',
    },
  });

  const dushanbe = await prisma.warehouse.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Душанбе',
      type: WarehouseType.DESTINATION,
      address: 'г. Душанбе, ул. Айни 42, склад 1',
      phone: '+992-37-221-1234',
    },
  });

  console.log('Warehouses created:', guangzhou.name, urumqi.name, dushanbe.name);

  // ─── Storage Cells (sample) ──────────────────────────────────────────────
  const cellCodes = ['A-01-01', 'A-01-02', 'A-01-03', 'A-02-01', 'A-02-02', 'A-02-03',
    'B-01-01', 'B-01-02', 'B-01-03', 'B-02-01', 'B-02-02', 'B-02-03'];

  for (const wh of [guangzhou, urumqi, dushanbe]) {
    for (const code of cellCodes) {
      await prisma.storageCell.upsert({
        where: { warehouseId_code: { warehouseId: wh.id, code } },
        update: {},
        create: { warehouseId: wh.id, code },
      });
    }
  }
  console.log('Storage cells created');

  // ─── Tariffs ─────────────────────────────────────────────────────────────
  await prisma.tariff.upsert({
    where: { originId_destinationId: { originId: guangzhou.id, destinationId: dushanbe.id } },
    update: {},
    create: {
      originId: guangzhou.id,
      destinationId: dushanbe.id,
      currency: Currency.USD,
      ratePerKg: 8.50,
      minPrice: 15.00,
      volDivisor: 6000,
      freeStorageDays: 30,
      storageFeePerDay: 0.50,
    },
  });

  await prisma.tariff.upsert({
    where: { originId_destinationId: { originId: urumqi.id, destinationId: dushanbe.id } },
    update: {},
    create: {
      originId: urumqi.id,
      destinationId: dushanbe.id,
      currency: Currency.USD,
      ratePerKg: 6.00,
      minPrice: 10.00,
      volDivisor: 6000,
      freeStorageDays: 30,
      storageFeePerDay: 0.30,
    },
  });

  await prisma.tariff.upsert({
    where: { originId_destinationId: { originId: guangzhou.id, destinationId: urumqi.id } },
    update: {},
    create: {
      originId: guangzhou.id,
      destinationId: urumqi.id,
      currency: Currency.USD,
      ratePerKg: 4.00,
      minPrice: 8.00,
      volDivisor: 6000,
      freeStorageDays: 30,
      storageFeePerDay: 0.30,
    },
  });

  console.log('Tariffs created');

  // ─── Exchange Rates ──────────────────────────────────────────────────────
  const rates = [
    { from: Currency.USD, to: Currency.CNY, rate: 7.25 },
    { from: Currency.USD, to: Currency.TJS, rate: 10.93 },
    { from: Currency.USD, to: Currency.RUB, rate: 88.50 },
    { from: Currency.CNY, to: Currency.USD, rate: 0.138 },
    { from: Currency.CNY, to: Currency.TJS, rate: 1.508 },
    { from: Currency.TJS, to: Currency.USD, rate: 0.0915 },
    { from: Currency.RUB, to: Currency.USD, rate: 0.0113 },
  ];

  for (const r of rates) {
    await prisma.exchangeRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency: r.from, toCurrency: r.to } },
      update: { rate: r.rate },
      create: { fromCurrency: r.from, toCurrency: r.to, rate: r.rate },
    });
  }
  console.log('Exchange rates created');

  // ─── Settings ────────────────────────────────────────────────────────────
  const settings = [
    { key: 'company_name', value: 'Cargo Consolidation', label: 'Название компании' },
    { key: 'max_box_weight_kg', value: '50', label: 'Макс. вес коробки (кг)' },
    { key: 'free_storage_days', value: '30', label: 'Бесплатное хранение (дней)' },
    { key: 'unclaimed_warning_days', value: '90', label: 'Предупреждение о невостребованности (дней)' },
    { key: 'default_currency', value: 'USD', label: 'Валюта по умолчанию' },
    { key: 'vol_divisor', value: '6000', label: 'Делитель объёмного веса' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('Settings created');

  // ─── Admin User ──────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { phone: '+992000000000' },
    update: {},
    create: {
      phone: '+992000000000',
      fullName: 'Администратор',
      role: UserRole.ADMIN,
      clientCode: 'CD-0001',
    },
  });
  console.log('Admin user created');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
