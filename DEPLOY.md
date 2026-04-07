# Деплой Cargo Consolidation на Vercel

## Архитектура деплоя

Проект состоит из 3 частей, каждую нужно деплоить отдельно:

| Компонент | Технология | Где деплоить |
|-----------|-----------|--------------|
| **Web (Next.js)** | Next.js 14 | Vercel (бесплатно) |
| **API (NestJS)** | NestJS + Prisma | Railway / Render / VPS |
| **Bot (grammY)** | Node.js | Railway / Render / VPS |

> Vercel подходит только для Next.js фронтенда. API и бот — это long-running Node.js процессы, для них нужен Railway, Render или VPS.

---

## Шаг 1: Подготовка базы данных (PostgreSQL)

### Вариант A: Neon (бесплатно)
1. Зайди на https://neon.tech и создай аккаунт
2. Создай новый проект → получишь `DATABASE_URL`
3. Скопируй строку подключения, будет вида:
   ```
   postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```

### Вариант B: Supabase (бесплатно)
1. Зайди на https://supabase.com → New Project
2. Settings → Database → Connection string (URI)

---

## Шаг 2: Деплой API (NestJS) на Render

1. Зайди на https://render.com и залогинься через GitHub
2. **New** → **Web Service** → подключи `LatifRjdev/cargo`
3. Настройки:
   - **Name**: `cargo-api`
   - **Region**: Oregon (US West) — ближе к Neon
   - **Root Directory**: оставь пустым (корень монорепо)
   - **Build Command**: `corepack enable && pnpm install --frozen-lockfile && cd apps/api && npx prisma generate && npx prisma migrate deploy && pnpm run build`
   - **Start Command**: `node apps/api/dist/main.js`
   - **Instance Type**: Free
4. Добавь **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NODE_VERSION` | `20` |
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Neon Pooled URL (с `&pgbouncer=true`) |
   | `DIRECT_URL` | Neon Direct URL |
   | `JWT_SECRET` | длинный случайный ключ |
   | `JWT_EXPIRES_IN` | `7d` |
   | `PORT` | `3001` |

5. Нажми **Create Web Service**
6. Render даст URL вида `https://cargo-api-xxxx.onrender.com`

> **Или используй `render.yaml`** — Render автоматически подтянет конфигурацию из файла

---

## Шаг 3: Деплой Web (Next.js) на Vercel

1. Зайди на https://vercel.com и залогинься через GitHub
2. **Add New Project** → Import `LatifRjdev/cargo`
3. Настройки проекта:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web` (нажми Edit и укажи)
4. **Environment Variables** — добавь:
   ```
   NEXT_PUBLIC_API_URL=https://cargo-api-xxx.up.railway.app/api
   ```
   (подставь реальный URL API из Шага 2)
5. Нажми **Deploy**

### Настройки билда (Vercel автоматически определит):
- Build Command: `cd ../.. && npx turbo run build --filter=@cargo/web`
- Output Directory: `.next`
- Install Command: `pnpm install`

> Если Vercel не находит pnpm — добавь env: `ENABLE_EXPERIMENTAL_COREPACK=1`

---

## Шаг 4: Деплой Telegram Bot (опционально)

1. На Railway создай ещё один сервис из того же репо
2. **Root Directory**: `apps/bot`
3. **Build Command**: `npm run build`
4. **Start Command**: `node dist/index.js`
5. Переменные:
   ```
   BOT_TOKEN=токен-от-BotFather
   API_URL=https://cargo-api-xxx.up.railway.app/api
   DATABASE_URL=postgresql://...
   ```

---

## Шаг 5: Настройка домена (опционально)

### На Vercel:
1. Settings → Domains → Add Domain
2. Укажи свой домен (напр. `cargo.example.com`)
3. Добавь DNS записи как указано в Vercel

### На Railway (для API):
1. Settings → Networking → Custom Domain

---

## Шаг 6: Применение миграций БД

Если Railway не выполнил миграции автоматически:
```bash
# Локально, указав DATABASE_URL от production базы
DATABASE_URL="postgresql://..." npx prisma migrate deploy
DATABASE_URL="postgresql://..." npx prisma db seed
```

---

## Переменные окружения — сводная таблица

### API (Railway/Render/VPS)
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Секрет для JWT токенов | `my-super-secret-key-32chars` |
| `JWT_EXPIRES_IN` | Время жизни токена | `7d` |
| `PORT` | Порт API | `3001` |
| `BOT_TOKEN` | Telegram Bot Token | `123456:ABC-DEF` |
| `MINIO_ENDPOINT` | S3/MinIO хост (для фото) | `s3.amazonaws.com` |
| `MINIO_ACCESS_KEY` | S3 Access Key | |
| `MINIO_SECRET_KEY` | S3 Secret Key | |
| `MINIO_BUCKET` | Название бакета | `cargo-photos` |

### Web (Vercel)
| Переменная | Описание | Пример |
|-----------|----------|--------|
| `NEXT_PUBLIC_API_URL` | URL бэкенда | `https://api.cargo.com/api` |

---

## Чеклист после деплоя

- [ ] Открыть сайт — видна лендинг страница
- [ ] Регистрация / вход работает
- [ ] API отвечает на `https://api-url/api/public/calculate`
- [ ] Курсы валют обновляются (проверить через 6 часов)
- [ ] Telegram бот отвечает на /start (если задеплоен)
- [ ] Lighthouse audit (4.10) — проверить скорость
