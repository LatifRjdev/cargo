import { Bot, InlineKeyboard } from 'grammy';

const token = process.env.BOT_TOKEN;
const apiUrl = process.env.API_URL || 'http://localhost:3001';

if (!token) {
  throw new Error('BOT_TOKEN environment variable is not set');
}

const bot = new Bot(token);

// ─── /start with deep link support ──────────────────────────────────────────
// Deep link format: /start link_<JWT_TOKEN>
// This links a Telegram account to the cargo platform user

bot.command('start', async (ctx) => {
  const payload = ctx.match; // text after /start
  const chatId = ctx.chat.id.toString();

  if (payload && payload.startsWith('link_')) {
    // Deep link: link Telegram to user account
    const jwtToken = payload.slice(5); // remove "link_" prefix
    try {
      const res = await fetch(`${apiUrl}/auth/telegram-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ telegramChatId: chatId }),
      });

      if (res.ok) {
        await ctx.reply(
          '✅ Аккаунт успешно привязан!\n\n' +
          'Теперь вы будете получать уведомления о ваших посылках и коробках.\n\n' +
          'Используйте /help чтобы увидеть доступные команды.',
        );
      } else {
        await ctx.reply(
          '❌ Не удалось привязать аккаунт. Ссылка устарела или недействительна.\n' +
          'Попробуйте получить новую ссылку в личном кабинете.',
        );
      }
    } catch {
      await ctx.reply('❌ Ошибка соединения с сервером. Попробуйте позже.');
    }
    return;
  }

  // Normal /start — show welcome
  const keyboard = new InlineKeyboard()
    .text('📦 Мои посылки', 'parcels')
    .text('📋 Мои коробки', 'boxes')
    .row()
    .text('📱 Мой QR-код', 'qr')
    .text('🏢 Адреса складов', 'addresses')
    .row()
    .text('🧮 Калькулятор', 'calculator')
    .text('🌐 Язык', 'language');

  await ctx.reply(
    '👋 Добро пожаловать в Cargo Bot!\n\n' +
    'Я помогу вам отслеживать посылки и коробки.\n\n' +
    'Для привязки аккаунта используйте ссылку из личного кабинета.\n' +
    'Для отслеживания коробки отправьте /track <код>.',
    { reply_markup: keyboard },
  );
});

// ─── /help ──────────────────────────────────────────────────────────────────

bot.command('help', (ctx) => {
  return ctx.reply(
    '📖 Доступные команды:\n\n' +
    '/start — Главное меню\n' +
    '/parcels — Мои посылки\n' +
    '/boxes — Мои коробки\n' +
    '/track <код> — Отследить коробку\n' +
    '/qr — Мой QR-код\n' +
    '/address — Адреса складов\n' +
    '/calc — Калькулятор стоимости\n' +
    '/language — Сменить язык\n' +
    '/help — Эта справка',
  );
});

// ─── /track <code> ──────────────────────────────────────────────────────────

bot.command('track', async (ctx) => {
  const code = ctx.match?.trim();
  if (!code) {
    return ctx.reply('Укажите код коробки: /track BX-20260326-0001');
  }

  try {
    const res = await fetch(`${apiUrl}/public/track/${encodeURIComponent(code)}`);
    if (!res.ok) {
      return ctx.reply('❌ Коробка не найдена. Проверьте код и попробуйте снова.');
    }

    const data: any = await res.json();

    const statusLabels: Record<string, string> = {
      REQUESTED: '📝 Запрошена',
      PACKING: '📦 Упаковывается',
      PACKED: '✅ Упакована',
      IN_TRANSIT: '🚚 В пути',
      CUSTOMS: '🛃 Таможня',
      ARRIVED: '📍 Прибыла',
      READY: '🎉 Готова к выдаче',
      DELIVERED: '✔️ Выдана',
    };

    let text = `📋 Коробка: ${data.boxCode}\n`;
    text += `Статус: ${statusLabels[data.status] || data.status}\n`;

    if (data.statusLog && data.statusLog.length > 0) {
      text += '\n📜 История:\n';
      for (const log of data.statusLog.slice(0, 10)) {
        const date = new Date(log.createdAt).toLocaleString('ru-RU');
        text += `  ${statusLabels[log.status] || log.status} — ${date}\n`;
      }
    }

    return ctx.reply(text);
  } catch {
    return ctx.reply('❌ Ошибка соединения. Попробуйте позже.');
  }
});

// ─── Inline keyboard callbacks ──────────────────────────────────────────────

bot.callbackQuery('parcels', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    '📦 Для просмотра посылок откройте личный кабинет.\n' +
    'Уведомления о новых посылках будут приходить автоматически.',
  );
});

bot.callbackQuery('boxes', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    '📋 Для просмотра коробок откройте личный кабинет.\n' +
    'Или отправьте /track <код> для отслеживания.',
  );
});

bot.callbackQuery('qr', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    '📱 Ваш QR-код доступен в личном кабинете.\n' +
    'Покажите его сотруднику склада при отправке посылок.',
  );
});

bot.callbackQuery('addresses', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    '🏢 Адреса складов:\n\n' +
    '🇨🇳 Гуанчжоу, Китай\n' +
    '🇨🇳 Урумчи, Китай\n' +
    '🇹🇯 Душанбе, Таджикистан\n\n' +
    'Подробные адреса и инструкции — в личном кабинете.',
  );
});

bot.callbackQuery('calculator', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    '🧮 Отправьте /calc <вес в кг> для расчёта стоимости.\n' +
    'Пример: /calc 5.2',
  );
});

bot.callbackQuery('language', async (ctx) => {
  await ctx.answerCallbackQuery();
  const keyboard = new InlineKeyboard()
    .text('🇷🇺 Русский', 'lang_ru')
    .text('🇹🇯 Тоҷикӣ', 'lang_tg');
  await ctx.reply('Выберите язык:', { reply_markup: keyboard });
});

bot.callbackQuery('lang_ru', async (ctx) => {
  await ctx.answerCallbackQuery('Язык: Русский');
  await ctx.reply('✅ Язык установлен: Русский');
});

bot.callbackQuery('lang_tg', async (ctx) => {
  await ctx.answerCallbackQuery('Забон: Тоҷикӣ');
  await ctx.reply('✅ Забон муқаррар шуд: Тоҷикӣ');
});

// ─── /calc ──────────────────────────────────────────────────────────────────

bot.command('calc', async (ctx) => {
  const input = ctx.match?.trim();
  if (!input) {
    return ctx.reply('Укажите вес: /calc 5.2');
  }

  const weight = parseFloat(input);
  if (isNaN(weight) || weight <= 0) {
    return ctx.reply('❌ Укажите корректный вес в кг. Пример: /calc 3.5');
  }

  try {
    const res = await fetch(`${apiUrl}/public/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: weight }),
    });

    if (!res.ok) {
      return ctx.reply('❌ Не удалось рассчитать. Попробуйте позже.');
    }

    const data: any = await res.json();
    let text = `🧮 Расчёт для ${weight} кг:\n\n`;
    if (data.price !== undefined) {
      text += `💰 Стоимость: $${data.price}\n`;
    }
    if (data.route) {
      text += `🛤 Маршрут: ${data.route}\n`;
    }

    return ctx.reply(text);
  } catch {
    return ctx.reply('❌ Ошибка соединения. Попробуйте позже.');
  }
});

// Alias commands
bot.command('parcels', (ctx) => ctx.reply('📦 Для просмотра посылок откройте личный кабинет.'));
bot.command('boxes', (ctx) => ctx.reply('📋 Отправьте /track <код> для отслеживания коробки.'));
bot.command('qr', (ctx) => ctx.reply('📱 QR-код доступен в личном кабинете.'));
bot.command('address', (ctx) => ctx.reply('🏢 Подробные адреса складов — в личном кабинете.'));
bot.command('language', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('🇷🇺 Русский', 'lang_ru')
    .text('🇹🇯 Тоҷикӣ', 'lang_tg');
  await ctx.reply('Выберите язык:', { reply_markup: keyboard });
});

bot.start();
console.log('Bot started');
