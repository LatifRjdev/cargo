---
description: Review recent code changes for issues
---

Review the recent code changes:

1. Run `git diff` to see all uncommitted changes
2. Check for:
   - TypeScript errors or type safety issues
   - Missing input validation
   - Security vulnerabilities (SQL injection, XSS, hardcoded secrets)
   - Broken API contracts (response shape changes)
   - Missing error handling
   - N+1 query problems
   - Missing i18n translations
   - Inconsistency with existing patterns
3. Run `pnpm build` to verify compilation
4. Provide a summary of findings with severity levels (critical/warning/info)
