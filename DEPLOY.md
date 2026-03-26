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

## Шаг 2: Деплой API (NestJS) на Railway

1. Зайди на https://railway.app и залогинься через GitHub
2. New Project → Deploy from GitHub repo → выбери `LatifRjdev/cargo`
3. Настрой сервис:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start Command**: `node dist/main.js`
4. Добавь переменные окружения (Variables):
   ```
   DATABASE_URL=postgresql://...  (из Шага 1)
   JWT_SECRET=сгенерируй-длинный-случайный-ключ
   JWT_EXPIRES_IN=7d
   PORT=3001
   BOT_TOKEN=токен-от-BotFather  (если есть)
   ```
5. Railway даст домен вида `cargo-api-xxx.up.railway.app`
6. Запомни URL — он нужен для веба: `https://cargo-api-xxx.up.railway.app/api`

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
