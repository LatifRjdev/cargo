-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'WAREHOUSE_WORKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('RU', 'TG');

-- CreateEnum
CREATE TYPE "Marketplace" AS ENUM ('TAOBAO', 'ALI_1688', 'PINDUODUO', 'POIZON', 'OTHER');

-- CreateEnum
CREATE TYPE "ParcelCategory" AS ENUM ('CLOTHING', 'ELECTRONICS', 'SHOES', 'COSMETICS', 'FOOD', 'HOUSEHOLD', 'OTHER');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('WAITING', 'RECEIVED', 'STORED', 'IN_BOX', 'REJECTED');

-- CreateEnum
CREATE TYPE "BoxStatus" AS ENUM ('REQUESTED', 'PACKING', 'PACKED', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('FORMING', 'DEPARTED', 'CUSTOMS', 'ARRIVED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'CNY', 'TJS', 'RUB');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('TELEGRAM', 'SMS', 'WEB');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('ORIGIN', 'TRANSIT', 'DESTINATION');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRANSPORT', 'CUSTOMS', 'PACKAGING', 'LABOR', 'WAREHOUSE_RENT', 'INSURANCE', 'FUEL', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseScope" AS ENUM ('BOX', 'BATCH', 'GENERAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "client_code" TEXT,
    "qr_code_url" TEXT,
    "telegram_chat_id" TEXT,
    "language" "Language" NOT NULL DEFAULT 'RU',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "warehouse_id" UUID,
    "home_warehouse_id" UUID,
    "organization_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "bin" TEXT,
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "current_debt" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "contact_phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WarehouseType" NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_cells" (
    "id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "is_occupied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "storage_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" UUID NOT NULL,
    "tracking_number" TEXT,
    "marketplace" "Marketplace",
    "category" "ParcelCategory",
    "description" TEXT,
    "weight_kg" DECIMAL(8,3),
    "length_cm" DECIMAL(8,2),
    "width_cm" DECIMAL(8,2),
    "height_cm" DECIMAL(8,2),
    "volumetric_weight" DECIMAL(8,3),
    "is_fragile" BOOLEAN NOT NULL DEFAULT false,
    "is_damaged" BOOLEAN NOT NULL DEFAULT false,
    "damage_description" TEXT,
    "is_unidentified" BOOLEAN NOT NULL DEFAULT false,
    "phone_on_label" TEXT,
    "status" "ParcelStatus" NOT NULL DEFAULT 'RECEIVED',
    "reject_reason" TEXT,
    "customer_id" UUID,
    "warehouse_id" UUID NOT NULL,
    "cell_id" UUID,
    "box_id" UUID,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_photos" (
    "id" UUID NOT NULL,
    "parcel_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'intake',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_status_log" (
    "id" UUID NOT NULL,
    "parcel_id" UUID NOT NULL,
    "status" "ParcelStatus" NOT NULL,
    "comment" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_boxes" (
    "id" UUID NOT NULL,
    "box_code" TEXT NOT NULL,
    "customer_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "customer_note" TEXT,
    "status" "BoxStatus" NOT NULL DEFAULT 'REQUESTED',
    "weight_kg" DECIMAL(8,3),
    "length_cm" DECIMAL(8,2),
    "width_cm" DECIMAL(8,2),
    "height_cm" DECIMAL(8,2),
    "volumetric_weight" DECIMAL(8,3),
    "billable_weight" DECIMAL(8,3),
    "estimated_price" DECIMAL(12,2),
    "final_price" DECIMAL(12,2),
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "shelf_location" TEXT,
    "batch_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "box_status_log" (
    "id" UUID NOT NULL,
    "box_id" UUID NOT NULL,
    "status" "BoxStatus" NOT NULL,
    "comment" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "box_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_batches" (
    "id" UUID NOT NULL,
    "batch_code" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'FORMING',
    "route" TEXT NOT NULL,
    "vehicle_number" TEXT,
    "total_boxes" INTEGER NOT NULL DEFAULT 0,
    "total_weight" DECIMAL(10,3),
    "departed_at" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_status_log" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "status" "BatchStatus" NOT NULL,
    "comment" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_status_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariffs" (
    "id" UUID NOT NULL,
    "origin_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "rate_per_kg" DECIMAL(8,2) NOT NULL,
    "min_price" DECIMAL(8,2) NOT NULL,
    "vol_divisor" INTEGER NOT NULL DEFAULT 6000,
    "free_storage_days" INTEGER NOT NULL DEFAULT 30,
    "storage_fee_per_day" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_tariffs" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "tariff_id" UUID NOT NULL,
    "rate_per_kg" DECIMAL(8,2),
    "discount_pct" DECIMAL(5,2),

    CONSTRAINT "org_tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" UUID NOT NULL,
    "from_currency" "Currency" NOT NULL,
    "to_currency" "Currency" NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "box_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "exchange_rate" DECIMAL(12,6),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "collected_by_id" UUID,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "scope" "ExpenseScope" NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "box_id" UUID,
    "batch_id" UUID,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_client_code_key" ON "users"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "storage_cells_warehouse_id_code_key" ON "storage_cells"("warehouse_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "consolidation_boxes_box_code_key" ON "consolidation_boxes"("box_code");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_batches_batch_code_key" ON "shipment_batches"("batch_code");

-- CreateIndex
CREATE UNIQUE INDEX "tariffs_origin_id_destination_id_key" ON "tariffs"("origin_id", "destination_id");

-- CreateIndex
CREATE UNIQUE INDEX "org_tariffs_organization_id_tariff_id_key" ON "org_tariffs"("organization_id", "tariff_id");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_from_currency_to_currency_key" ON "exchange_rates"("from_currency", "to_currency");

-- CreateIndex
CREATE UNIQUE INDEX "payments_box_id_key" ON "payments"("box_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "expenses_scope_idx" ON "expenses"("scope");

-- CreateIndex
CREATE INDEX "expenses_box_id_idx" ON "expenses"("box_id");

-- CreateIndex
CREATE INDEX "expenses_batch_id_idx" ON "expenses"("batch_id");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_home_warehouse_id_fkey" FOREIGN KEY ("home_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_cells" ADD CONSTRAINT "storage_cells_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_cell_id_fkey" FOREIGN KEY ("cell_id") REFERENCES "storage_cells"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "consolidation_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_photos" ADD CONSTRAINT "parcel_photos_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_status_log" ADD CONSTRAINT "parcel_status_log_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidation_boxes" ADD CONSTRAINT "consolidation_boxes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidation_boxes" ADD CONSTRAINT "consolidation_boxes_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consolidation_boxes" ADD CONSTRAINT "consolidation_boxes_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "shipment_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "box_status_log" ADD CONSTRAINT "box_status_log_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "consolidation_boxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_status_log" ADD CONSTRAINT "batch_status_log_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "shipment_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_origin_id_fkey" FOREIGN KEY ("origin_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tariffs" ADD CONSTRAINT "org_tariffs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_tariffs" ADD CONSTRAINT "org_tariffs_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "consolidation_boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_collected_by_id_fkey" FOREIGN KEY ("collected_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "consolidation_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "shipment_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
