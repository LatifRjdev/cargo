# Cargo Consolidation System — Architecture

> v1.1 — Web + Telegram Bot (no mobile app)

## Business Flow

```
Customer registers → Gets unique ID (e.g. CD-7842) + QR code
→ Buys on Taobao/1688/Pinduoduo → Ships to warehouse address + their ID
→ Parcel arrives at warehouse (Guangzhou / Urumqi)
→ Worker: scans QR → marketplace → photos → weighs → measures → category
   → if damaged: mark + photo
   → if no code: "unidentified" → try match by phone
   → if prohibited: reject + notify
→ Customer sees parcel in dashboard (Web / Telegram)
→ Customer clicks "Build Box" (selects parcels from SAME warehouse + note)
   → System validates: same warehouse, weight limit, no unconfirmed damage
→ Worker consolidates → packs → weighs → measures → price calculated
→ Worker creates shipment batch (multiple boxes) → prints manifest
→ Batch travels: Guangzhou → Urumqi → Dushanbe (status updates at each point)
→ Arrives in Dushanbe → boxes distributed to shelves
→ Customer notified → comes to warehouse
→ Worker: finds box → shows price (converted to local currency)
→ Customer pays (cash / transfer / card) → worker confirms → receipt PDF
→ Box delivered ✓
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + NestJS (TypeScript) |
| Database | PostgreSQL 16 + Prisma ORM |
| API | REST + WebSocket (real-time) |
| Web Frontend | Next.js 14 (React) + Tailwind CSS |
| Telegram Bot | grammY (TypeScript) |
| File Storage | S3-compatible (MinIO self-hosted) |
| QR Generation | qrcode (npm) |
| PDF Generation | pdfkit or @react-pdf/renderer |
| Notifications | Telegram Bot API via BullMQ queue |
| Cache/Queue | Redis + BullMQ |
| Deploy | Docker Compose → VPS |
| CI/CD | GitHub Actions |

## Database (18 tables)

### Core
1. **users** — customers (with client_code), warehouse workers (with warehouse_id), admins
2. **organizations** — B2B companies (credit limit, debt)
3. **warehouses** — Guangzhou (origin), Urumqi (transit), Dushanbe (destination)
4. **storage_cells** — shelf locations per warehouse (A-03-12)

### Parcels
5. **parcels** — individual packages (marketplace, category, weight, dims, damage, status)
6. **parcel_photos** — photos (intake, damage, custom)
7. **parcel_status_log** — status history

### Consolidation
8. **consolidation_boxes** — grouped parcels for shipment (weight, price, status, customer_note)
9. **box_status_log** — status history

### Logistics
10. **shipment_batches** — truck/container loads (route, vehicle, status)
11. **batch_status_log** — status history

### Pricing
12. **tariffs** — per route pricing (price/kg, min, vol_divisor, storage fees)
13. **org_tariffs** — B2B overrides
14. **exchange_rates** — currency conversion (admin-managed)

### Transactions
15. **payments** — COD payments (method, amount, currency, exchange rate used)
16. **notifications** — message log (channel, event, status)

### System
17. **settings** — company configuration (key-value)
18. **audit_log** — employee action log (who, what, when, details)

## Web Application Structure

### Three panels in one Next.js app:

```
/[locale]/dashboard/*     — Customer cabinet
/[locale]/warehouse/*     — Worker panel (mobile-first)
/[locale]/admin/*         — Admin panel
/[locale]/track/*         — Public tracking (no auth)
/                         — Public landing (calculator, tracking)
```

### Customer Cabinet Pages
- Dashboard (parcels count by warehouse, boxes in transit, ready for pickup)
- My Parcels (list, detail, add tracking, claim unidentified)
- My Boxes (list, detail + timeline, "Build Box" flow)
- My QR Code (display, download PDF)
- Warehouse Addresses (copy, instructions)
- Payments (history)
- Calculator
- Profile + Settings (language, home warehouse)

### Worker Panel Pages (mobile-first)
- Intake (scan QR → form wizard: marketplace → photos → weight → dims → category)
- Unidentified Parcels (list, assign to customer)
- Parcels List (filters, search)
- Packing Queue (box requests with customer notes)
- Pack Box (weigh, measure, confirm → print label)
- Shipments (create batch, add boxes, update status, print manifest)
- Pickup (search box → payment → deliver → receipt)
- Cells (grid view, occupancy)

### Admin Panel Pages
- Dashboard (real-time widgets, charts, alerts)
- Global Search
- Users (CRUD, roles, warehouses, block)
- Warehouses (CRUD)
- Tariffs (CRUD)
- Exchange Rates (view, edit)
- Organizations + B2B Tariffs
- Prohibited Items
- Reports (revenue, parcels, delivery time, debts, marketplaces, categories, storage)
  — each with export to Excel/CSV
- Broadcast Notifications
- Audit Log
- Company Settings (name, logo, storage rules, limits)

## Project Structure

```
cargo/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── parcels/
│   │   │   │   ├── boxes/
│   │   │   │   ├── shipments/
│   │   │   │   ├── warehouses/
│   │   │   │   ├── tariffs/
│   │   │   │   ├── exchange-rates/
│   │   │   │   ├── payments/
│   │   │   │   ├── notifications/
│   │   │   │   ├── admin/
│   │   │   │   ├── settings/
│   │   │   │   ├── reports/
│   │   │   │   └── pdf/
│   │   │   ├── common/       # guards, interceptors, pipes, audit middleware
│   │   │   └── prisma/
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── web/                  # Next.js frontend
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── dashboard/    # customer
│   │   │   │   ├── warehouse/    # worker (mobile-first)
│   │   │   │   ├── admin/        # admin
│   │   │   │   └── track/        # public tracking
│   │   │   └── page.tsx          # landing
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── customer/
│   │   │   ├── warehouse/
│   │   │   └── admin/
│   │   └── lib/
│   └── bot/                  # Telegram bot (grammY)
│       └── src/
│           ├── commands/
│           ├── menus/
│           ├── i18n/
│           └── services/
├── packages/
│   ├── shared/               # types, enums, constants
│   └── i18n/                 # translations (ru.json, tg.json)
├── docker-compose.yml
├── PRD.md
├── architecture.md
└── progress.txt
```
