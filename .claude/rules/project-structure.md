---
description: Monorepo structure and package boundaries
globs: "**/*"
---

# Project Structure Rules

## Package Boundaries
- `@cargo/shared` — types, enums, constants shared between all apps. NO runtime dependencies.
- `@cargo/i18n` — translation strings only. NO business logic.
- `@cargo/api` — backend. Can import shared and i18n.
- `@cargo/web` — frontend. Can import shared and i18n.
- `@cargo/bot` — telegram bot. Can import shared and i18n.

## Adding Dependencies
- Shared types/enums → add to `packages/shared/src/`
- New translations → add to both `packages/i18n/src/ru.ts` and `tg.ts`
- New API feature → create module in `apps/api/src/modules/`
- New page → create in `apps/web/src/app/[locale]/`
- Package deps → use `pnpm --filter <package> add <dep>`

## NestJS Module Structure
```
modules/feature-name/
  feature-name.module.ts
  feature-name.controller.ts
  feature-name.service.ts
  dto/
    create-feature.dto.ts
    update-feature.dto.ts
```

## Next.js Page Structure
```
app/[locale]/section/
  page.tsx          — main page component
  layout.tsx        — layout wrapper (if needed)
  components/       — page-specific components
```
