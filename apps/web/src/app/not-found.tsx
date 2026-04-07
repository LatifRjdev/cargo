'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [locale, setLocale] = useState('ru');

  useEffect(() => {
    const saved = localStorage.getItem('locale');
    if (saved === 'tg') setLocale('tg');
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md text-center">
        <div className="relative mb-6 inline-flex">
          <span className="select-none text-[120px] font-black leading-none tracking-tight text-slate-100">404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
              <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{locale === 'tg' ? 'Саҳифа ёфт нашуд' : 'Страница не найдена'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {locale === 'tg' ? 'Саҳифаи дархостшуда вуҷуд надорад ё нест шудааст.' : 'Запрашиваемая страница не существует или была удалена.'}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
            {locale === 'tg' ? 'Ба асосӣ' : 'На главную'}
          </Link>
          <Link href={`/${locale}/dashboard`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
            {locale === 'tg' ? 'Ба кабинет' : 'В кабинет'}
          </Link>
        </div>
        <p className="mt-8 text-xs text-slate-400">
          <a href={`/${locale}/login`} className="text-blue-500 hover:text-blue-600 transition-colors">
            {locale === 'tg' ? 'Даромадан' : 'Войти в систему'}
          </a>
        </p>
      </div>
    </div>
  );
}
