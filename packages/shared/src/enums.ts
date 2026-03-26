export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  WAREHOUSE_WORKER = 'WAREHOUSE_WORKER',
  ADMIN = 'ADMIN',
}

export enum Language {
  RU = 'RU',
  TG = 'TG',
}

export enum Marketplace {
  TAOBAO = 'TAOBAO',
  ALI_1688 = 'ALI_1688',
  PINDUODUO = 'PINDUODUO',
  POIZON = 'POIZON',
  OTHER = 'OTHER',
}

export enum ParcelCategory {
  CLOTHING = 'CLOTHING',
  ELECTRONICS = 'ELECTRONICS',
  SHOES = 'SHOES',
  COSMETICS = 'COSMETICS',
  FOOD = 'FOOD',
  HOUSEHOLD = 'HOUSEHOLD',
  OTHER = 'OTHER',
}

export enum ParcelStatus {
  WAITING = 'WAITING',
  RECEIVED = 'RECEIVED',
  STORED = 'STORED',
  IN_BOX = 'IN_BOX',
  REJECTED = 'REJECTED',
}

export enum BoxStatus {
  REQUESTED = 'REQUESTED',
  PACKING = 'PACKING',
  PACKED = 'PACKED',
  IN_TRANSIT = 'IN_TRANSIT',
  CUSTOMS = 'CUSTOMS',
  ARRIVED = 'ARRIVED',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum BatchStatus {
  FORMING = 'FORMING',
  DEPARTED = 'DEPARTED',
  CUSTOMS = 'CUSTOMS',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}

export enum Currency {
  USD = 'USD',
  CNY = 'CNY',
  TJS = 'TJS',
  RUB = 'RUB',
}

export enum NotificationChannel {
  TELEGRAM = 'TELEGRAM',
  SMS = 'SMS',
  WEB = 'WEB',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum WarehouseType {
  ORIGIN = 'ORIGIN',
  TRANSIT = 'TRANSIT',
  DESTINATION = 'DESTINATION',
}

export enum ExpenseCategory {
  TRANSPORT = 'TRANSPORT',
  CUSTOMS = 'CUSTOMS',
  PACKAGING = 'PACKAGING',
  LABOR = 'LABOR',
  WAREHOUSE_RENT = 'WAREHOUSE_RENT',
  INSURANCE = 'INSURANCE',
  FUEL = 'FUEL',
  OTHER = 'OTHER',
}

export enum ExpenseScope {
  BOX = 'BOX',
  BATCH = 'BATCH',
  GENERAL = 'GENERAL',
}
