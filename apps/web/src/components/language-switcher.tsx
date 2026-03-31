'use client';

import { useI18n } from '@/lib/i18n-context';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex gap-1 rounded-lg border bg-white p-0.5">
      <button
        onClick={() => setLocale('ru')}
        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
          locale === 'ru' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
        }`}
      >
        RU
      </button>
      <button
        onClick={() => setLocale('tg')}
        className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
          locale === 'tg' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
        }`}
      >
        TJ
      </button>
    </div>
  );
}
