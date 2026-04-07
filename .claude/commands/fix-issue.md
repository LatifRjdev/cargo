---
description: Diagnose and fix a bug
---

Follow this process to fix the reported issue:

1. **Understand**: Read the relevant code to understand the current behavior
2. **Reproduce**: Identify the root cause of the bug
3. **Fix**: Make the minimal change needed to fix the issue
4. **Verify**: Run `pnpm build` to ensure no TypeScript errors
5. **Test**: Run relevant tests with `pnpm --filter @cargo/api test`
6. **Explain**: Briefly explain what was wrong and how you fixed it

$ARGUMENTS
