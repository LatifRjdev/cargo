---
description: Create a new NestJS API module with controller, service, and DTOs
---

Create a new NestJS module for the feature described below. Follow existing patterns:

1. Create the module directory: `apps/api/src/modules/<name>/`
2. Create files:
   - `<name>.module.ts` — NestJS module with imports/providers/controllers
   - `<name>.controller.ts` — REST endpoints with Swagger decorators
   - `<name>.service.ts` — Business logic with Prisma queries
   - `dto/create-<name>.dto.ts` — Input validation with class-validator
   - `dto/update-<name>.dto.ts` — Partial update DTO
3. Register the module in `apps/api/src/app.module.ts`
4. Add any new Prisma models if needed
5. Run `pnpm build` to verify

Feature: $ARGUMENTS
