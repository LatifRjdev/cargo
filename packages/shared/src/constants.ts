import { Currency, ExpenseCategory, Marketplace, ParcelCategory } from './enums';

export const DEFAULT_VOL_DIVISOR = 6000;

export const MAX_BOX_WEIGHT_KG = 50;

export const FREE_STORAGE_DAYS = 30;

export const CLIENT_CODE_PREFIX = 'CD';

export const CURRENCIES: Currency[] = [
  Currency.USD,
  Currency.CNY,
  Currency.TJS,
  Currency.RUB,
];

export const MARKETPLACES: { label: string; value: Marketplace }[] = [
  { label: 'Taobao', value: Marketplace.TAOBAO },
  { label: '1688', value: Marketplace.ALI_1688 },
  { label: 'Pinduoduo', value: Marketplace.PINDUODUO },
  { label: 'Poizon', value: Marketplace.POIZON },
  { label: 'Другое', value: Marketplace.OTHER },
];

export const PARCEL_CATEGORIES: { label: string; value: ParcelCategory }[] = [
  { label: 'Одежда', value: ParcelCategory.CLOTHING },
  { label: 'Электроника', value: ParcelCategory.ELECTRONICS },
  { label: 'Обувь', value: ParcelCategory.SHOES },
  { label: 'Косметика', value: ParcelCategory.COSMETICS },
  { label: 'Продукты', value: ParcelCategory.FOOD },
  { label: 'Бытовые товары', value: ParcelCategory.HOUSEHOLD },
  { label: 'Другое', value: ParcelCategory.OTHER },
];

export const EXPENSE_CATEGORIES: { label: string; value: ExpenseCategory }[] = [
  { label: 'Транспортировка', value: ExpenseCategory.TRANSPORT },
  { label: 'Таможня', value: ExpenseCategory.CUSTOMS },
  { label: 'Упаковка', value: ExpenseCategory.PACKAGING },
  { label: 'Работа', value: ExpenseCategory.LABOR },
  { label: 'Аренда склада', value: ExpenseCategory.WAREHOUSE_RENT },
  { label: 'Страховка', value: ExpenseCategory.INSURANCE },
  { label: 'Топливо', value: ExpenseCategory.FUEL },
  { label: 'Прочее', value: ExpenseCategory.OTHER },
];
