---
description: REST API design patterns and conventions
globs: "apps/api/**/*.ts"
---

# API Conventions

## Route Structure
- `/api/auth/*` — authentication (public)
- `/api/public/*` — tracking, calculator (public)
- `/api/me/*` — current user operations (authenticated)
- `/api/warehouse/*` — warehouse worker operations (WAREHOUSE_WORKER role)
- `/api/admin/*` — admin operations (ADMIN role)

## Controllers
- Use `@ApiTags()` for Swagger grouping
- Use `@ApiOperation()` on every endpoint
- Use `@ApiBearerAuth()` on authenticated endpoints
- Return consistent response shape: `{ data?, message?, status }`

## DTOs
- Create separate Create/Update DTOs
- Use class-validator: @IsString, @IsEnum, @IsOptional, @IsUUID, etc.
- Use class-transformer: @Type, @Transform for type coercion
- Always whitelist properties (global validation pipe handles this)

## Auth & Guards
- JWT Bearer token in Authorization header
- Use role-based guards for protected routes
- Token refresh flow: access token expires -> client calls refresh endpoint

## Error Handling
- Throw NestJS HttpException or custom ApiError
- Include meaningful error messages
- Use appropriate HTTP status codes (400, 401, 403, 404, 409, 422)
