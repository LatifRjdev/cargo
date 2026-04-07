---
description: Code style and naming conventions for the Cargo project
globs: "**/*.{ts,tsx}"
---

# Code Style

## Naming
- Files/functions: camelCase (`parcelService.ts`, `calculateWeight`)
- Classes/Components: PascalCase (`ParcelController`, `DashboardPage`)
- Enums: UPPER_SNAKE_CASE values (`WAREHOUSE_WORKER`, `IN_TRANSIT`)
- Database columns in Prisma: snake_case (`created_at`, `client_code`)
- TypeScript fields: camelCase (Prisma maps automatically)

## TypeScript
- Use strict mode, no `any` unless absolutely necessary
- Prefer interfaces for object shapes, types for unions/intersections
- Always type function parameters and return values in API code
- Use enums from @cargo/shared, never hardcode string literals for statuses/roles

## React / Next.js
- Functional components only, no class components
- Use Tailwind utility classes, avoid inline styles and CSS modules
- Keep components focused — extract subcomponents when logic gets complex
- Use `'use client'` directive only when the component needs interactivity

## NestJS
- One module per feature domain (parcels, boxes, shipments, etc.)
- DTOs with class-validator decorators for all input validation
- Services contain business logic, controllers are thin
- Use @ApiOperation and @ApiResponse decorators for Swagger docs
