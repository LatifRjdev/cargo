---
description: Git workflow and commit conventions
globs: "**/*"
---

# Git Workflow

## Commits
- Write commit messages in English
- Use conventional format: `type: description`
  - feat: new feature
  - fix: bug fix
  - refactor: code restructuring
  - docs: documentation
  - test: adding/updating tests
  - chore: maintenance tasks
- Keep commits focused on a single change

## Branches
- `main` — production-ready code
- Feature branches: `feat/feature-name`
- Fix branches: `fix/bug-description`

## Before Committing
- Run `pnpm build` to check for TypeScript errors
- Run tests if API logic was changed
- Don't commit .env files, node_modules, or generated files
