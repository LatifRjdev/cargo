---
description: Database and Prisma conventions
globs: "**/*.prisma,apps/api/**/*.ts"
---

# Database Rules

## Prisma
- Schema location: `apps/api/prisma/schema.prisma`
- Always run `npx prisma generate` after schema changes
- Create migrations with `npx prisma migrate dev --name descriptive_name`
- Use `@default(uuid())` for all primary keys
- Use `@map("snake_case")` for column mapping when needed

## Patterns
- All tables use UUID primary keys
- Timestamps: `created_at` and `updated_at` on every table
- Soft deletes where needed (check existing patterns)
- Status tracking via separate log tables (ParcelStatusLog, BoxStatusLog, BatchStatusLog)

## Relations
- Always define both sides of a relation
- Use `onDelete: Cascade` for child records that can't exist without parent
- Use `onDelete: SetNull` for optional references

## Queries
- Use Prisma's `include` for eager loading, avoid N+1 queries
- Use transactions for multi-table mutations
- Paginate all list endpoints (use PaginationQuery from @cargo/shared)
