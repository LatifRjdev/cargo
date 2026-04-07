---
description: Security practices
globs: "**/*.{ts,tsx}"
---

# Security Rules

## Never
- Hardcode secrets, tokens, or API keys in source code
- Commit .env files (only .env.example)
- Expose internal error details to clients in production
- Trust client-side input without validation
- Use `any` to bypass type safety on auth/permission checks

## Always
- Validate all input with class-validator DTOs
- Use parameterized queries (Prisma handles this)
- Check user roles before performing operations
- Sanitize user-provided data before rendering (XSS prevention)
- Use HTTPS in production

## Auth
- JWT secrets must come from environment variables
- Token validation must check token type (access vs refresh)
- OTP codes must expire (5 min TTL in Redis)
- Rate-limit auth endpoints in production
