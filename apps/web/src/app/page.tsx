'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [trackCode, setTrackCode] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const handleCalc = async () => {
    if (!calcWeight) return;
    setCalcLoading(true);
    try {
      const res = await fetch(`${apiUrl}/public/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightKg: parseFloat(calcWeight) }),
      });
      if (res.ok) setCalcResult(await res.json());
    } catch {
      // silent
    } finally {
      setCalcLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">Cargo</span>
            <span className="text-sm text-gray-400">Consolidation</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/ru/track" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Отследить
            </Link>
            <Link
              href="/ru/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Войти
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Доставка грузов из Китая в Таджикистан
            </h1>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              Надёжная консолидация и доставка посылок. Отслеживание в реальном времени,
              прозрачные цены, уведомления на каждом этапе.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/ru/register"
                className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Зарегистрироваться
              </Link>
              <Link
                href="/ru/login"
                className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Войти в кабинет
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Как это работает</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { step: '1', title: 'Регистрация', desc: 'Зарегистрируйтесь и получите уникальный QR-код клиента' },
              { step: '2', title: 'Отправка', desc: 'Укажите наш адрес склада в Китае при заказе товаров' },
              { step: '3', title: 'Консолидация', desc: 'Мы принимаем ваши посылки и упаковываем в одну коробку' },
              { step: '4', title: 'Доставка', desc: 'Забирайте коробку в Душанбе с оплатой при получении' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick tools: Track + Calculator */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Track */}
            <div className="rounded-xl border bg-white p-6 md:p-8">
              <h3 className="text-xl font-bold mb-2">Отследить коробку</h3>
              <p className="text-sm text-gray-500 mb-4">Введите код коробки для проверки статуса</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="BX-20260326-0001"
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Link
                  href={trackCode ? `/ru/track?code=${encodeURIComponent(trackCode)}` : '/ru/track'}
                  className="rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 transition-colors"
                >
                  Найти
                </Link>
              </div>
            </div>

            {/* Calculator */}
            <div className="rounded-xl border bg-white p-6 md:p-8">
              <h3 className="text-xl font-bold mb-2">Калькулятор стоимости</h3>
              <p className="text-sm text-gray-500 mb-4">Рассчитайте примерную стоимость доставки</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  placeholder="Вес в кг"
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCalc}
                  disabled={calcLoading || !calcWeight}
                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {calcLoading ? '...' : 'Рассчитать'}
                </button>
              </div>
              {calcResult && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
                  <span className="font-medium text-green-700">
                    Стоимость: ${calcResult.price}
                  </span>
                  {calcResult.route && (
                    <span className="text-green-600 ml-2">({calcResult.route})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Преимущества</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '📍', title: 'Отслеживание', desc: 'Следите за каждой посылкой и коробкой в реальном времени' },
              { icon: '💰', title: 'Прозрачные цены', desc: 'Оплата по факту за реальный вес. Без скрытых комиссий' },
              { icon: '📱', title: 'Telegram-бот', desc: 'Уведомления обо всех этапах прямо в Telegram' },
              { icon: '📦', title: 'Консолидация', desc: 'Объединяйте несколько посылок в одну коробку и экономьте' },
              { icon: '🛃', title: 'Таможня', desc: 'Полное сопровождение на таможне без лишних хлопот' },
              { icon: '🔒', title: 'Безопасность', desc: 'Фото каждой посылки при приёмке. Страховка хрупких товаров' },
            ].map((f) => (
              <div key={f.title} className="rounded-lg border p-5 hover:shadow-md transition-shadow">
                <span className="text-2xl">{f.icon}</span>
                <h3 className="font-semibold mt-3 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Начните отправлять сегодня</h2>
          <p className="text-blue-100 mb-6">Регистрация бесплатна. Получите QR-код за 2 минуты.</p>
          <Link
            href="/ru/register"
            className="inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
          >
            Зарегистрироваться бесплатно
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">Cargo Consolidation System</p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/ru/track" className="hover:text-gray-700">Отслеживание</Link>
            <Link href="/ru/login" className="hover:text-gray-700">Вход</Link>
            <Link href="/ru/register" className="hover:text-gray-700">Регистрация</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
