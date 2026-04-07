# Cargo — Logistics Consolidation Platform

## Overview
Monorepo for a cargo consolidation service (Tajikistan/Central Asia). Customers send parcels from marketplaces, warehouse workers receive/pack them into boxes, admins manage shipments and finances.

## Tech Stack
- **Monorepo**: pnpm workspaces + Turborepo
- **API**: NestJS 11, Prisma 6, PostgreSQL 16, Redis 7, BullMQ 5, MinIO (S3)
- **Web**: Next.js 14 (App Router), React 18, Tailwind CSS 3
- **Bot**: grammY 1.25 (Telegram)
- **Shared**: @cargo/shared (types, enums, constants), @cargo/i18n (ru, tg)

## Project Structure
```
apps/api/       — NestJS REST API (port 3001/3002)
apps/web/       — Next.js frontend (port 3000/3003)
apps/bot/       — Telegram bot
packages/shared/ — Shared types, enums, constants
packages/i18n/   — Translations (Russian, Tajik)
```

## Key Commands
```bash
pnpm dev                          # All dev servers
pnpm --filter @cargo/api dev      # API only
pnpm --filter @cargo/web dev      # Web only
pnpm --filter @cargo/bot dev      # Bot only
pnpm build                        # Build all
pnpm db:migrate                   # Prisma migrations
pnpm --filter @cargo/api test     # Run tests
docker compose up -d              # Start local infra (postgres, redis, minio)
```

## Architecture
- API routes: `/api/auth/*`, `/api/me/*`, `/api/public/*`, `/api/warehouse/*`, `/api/admin/*`
- Swagger docs: `http://localhost:3001/api/docs`
- Auth: OTP via phone -> JWT (access + refresh tokens)
- Roles: CUSTOMER, WAREHOUSE_WORKER, ADMIN
- i18n: `[locale]` segment in Next.js routes (ru, tg)

## Conventions
- All API modules follow NestJS pattern: module + controller + service + DTOs
- Frontend uses functional React components with Tailwind
- Database uses UUID primary keys
- Shared enums/types must go in @cargo/shared
- Translations must go in @cargo/i18n
- Dev OTP code: 0000

## Before Making Changes
- Read the relevant module/component before editing
- Check @cargo/shared for existing types before creating new ones
- Run `pnpm build` to verify no TypeScript errors after changes
- Run tests after modifying API logic: `pnpm --filter @cargo/api test`
