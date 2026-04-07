---
description: Error handling patterns
globs: "apps/api/**/*.ts,apps/web/**/*.{ts,tsx}"
---

# Error Handling

## API (NestJS)
- Use HttpException subclasses: BadRequestException, NotFoundException, UnauthorizedException, ForbiddenException
- For business logic errors, use custom ApiError with appropriate status codes
- Always return consistent error shape: `{ statusCode, message, error? }`
- Log errors server-side but don't leak internal details to clients

## Frontend (Next.js)
- API client (`apps/web/src/lib/api.ts`) handles token refresh automatically
- On 401: attempt token refresh, retry request. On failure: redirect to login
- Show user-friendly error messages using i18n translations
- Use try/catch around API calls, handle loading/error states in UI
