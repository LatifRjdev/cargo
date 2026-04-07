---
description: Testing conventions and patterns
globs: "**/*.spec.ts,**/*.test.ts"
---

# Testing Rules

## Structure
- Test files: `apps/api/test/*.spec.ts`
- Use Jest + supertest for API integration tests
- Use @nestjs/testing for test module setup

## Patterns
- Test against real database when possible (docker compose provides PostgreSQL)
- Group tests with `describe()` by feature/endpoint
- Use `beforeAll` for app setup, `afterAll` for cleanup
- Test both success and error cases
- Verify response shape and status codes

## Running Tests
```bash
pnpm --filter @cargo/api test          # Run all tests
pnpm --filter @cargo/api test:watch    # Watch mode
npx jest test/auth.spec.ts             # Single file
```

## What to Test
- All public API endpoints
- Auth flows (login, OTP, refresh)
- Role-based access (ensure guards work)
- Business logic (pricing calculations, status transitions)
- Edge cases (invalid input, missing data, duplicates)
