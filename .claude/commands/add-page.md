---
description: Create a new Next.js page with i18n support
---

Create a new Next.js page following existing patterns:

1. Create the page at `apps/web/src/app/[locale]/<path>/page.tsx`
2. Use the i18n context for all user-visible text
3. Add translations to both `packages/i18n/src/ru.ts` and `tg.ts`
4. Follow Tailwind CSS patterns from existing pages
5. Connect to API using the api client from `apps/web/src/lib/api.ts`
6. Handle loading and error states
7. Run `pnpm build` to verify

Page details: $ARGUMENTS
