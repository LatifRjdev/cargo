---
description: Start local development environment
---

Start the full local development environment:

1. Start Docker services (postgres, redis, minio): `docker compose up -d`
2. Verify services are running: `docker ps`
3. Run Prisma migrations: `cd apps/api && npx prisma migrate dev`
4. Start all dev servers: `pnpm dev`

Report the status of each service and any errors encountered.
