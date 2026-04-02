-- CreateEnum
CREATE TYPE "PartnerIntegration" AS ENUM ('MANUAL', 'WEBHOOK', 'API');

-- CreateEnum
CREATE TYPE "PartnerShipmentStatus" AS ENUM ('CREATED', 'PICKED_UP', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "partners" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "integration" "PartnerIntegration" NOT NULL DEFAULT 'MANUAL',
    "api_key" TEXT,
    "api_secret" TEXT,
    "api_base_url" TEXT,
    "webhook_url" TEXT,
    "tracking_url_template" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "contact_person" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_shipments" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "partner_tracking_code" TEXT NOT NULL,
    "status" "PartnerShipmentStatus" NOT NULL DEFAULT 'CREATED',
    "partner_status" TEXT,
    "estimated_delivery" TIMESTAMP(3),
    "actual_delivery" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "notes" TEXT,
    "box_id" UUID,
    "customer_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_shipment_logs" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "status" "PartnerShipmentStatus" NOT NULL,
    "raw_status" TEXT,
    "location" TEXT,
    "comment" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_shipment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_status_mappings" (
    "id" UUID NOT NULL,
    "partner_id" UUID NOT NULL,
    "partner_status" TEXT NOT NULL,
    "mapped_status" "PartnerShipmentStatus" NOT NULL,

    CONSTRAINT "partner_status_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_code_key" ON "partners"("code");

-- CreateIndex
CREATE UNIQUE INDEX "partners_api_key_key" ON "partners"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "partner_shipments_box_id_key" ON "partner_shipments"("box_id");

-- CreateIndex
CREATE INDEX "partner_shipments_status_idx" ON "partner_shipments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "partner_shipments_partner_id_partner_tracking_code_key" ON "partner_shipments"("partner_id", "partner_tracking_code");

-- CreateIndex
CREATE UNIQUE INDEX "partner_status_mappings_partner_id_partner_status_key" ON "partner_status_mappings"("partner_id", "partner_status");

-- AddForeignKey
ALTER TABLE "partner_shipments" ADD CONSTRAINT "partner_shipments_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_shipments" ADD CONSTRAINT "partner_shipments_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "consolidation_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_shipments" ADD CONSTRAINT "partner_shipments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_shipment_logs" ADD CONSTRAINT "partner_shipment_logs_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "partner_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_status_mappings" ADD CONSTRAINT "partner_status_mappings_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
