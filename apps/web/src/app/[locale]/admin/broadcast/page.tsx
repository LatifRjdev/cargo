'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

type Target = 'all' | 'warehouse' | 'selected';

const TARGET_OPTIONS: { value: Target; label: string; description: string }[] = [
  { value: 'all', label: 'Все пользователи', description: 'Все пользователи с Telegram' },
  { value: 'warehouse', label: 'Пользователи склада', description: 'По ID склада' },
  { value: 'selected', label: 'Выбранные', description: 'По списку ID пользователей' },
];

export default function BroadcastPage() {
  const { t, locale } = useI18n();
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [warehouseId, setWarehouseId] = useState('');
  const [userIds, setUserIds] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number } | null>(null);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!confirm(`Отправить уведомление (${target === 'all' ? 'всем' : target === 'warehouse' ? 'складу' : 'выбранным'})?`)) return;

    setSending(true);
    setError('');
    setResult(null);
    try {
      const body: Record<string, unknown> = { message: message.trim(), target };
      if (target === 'warehouse') body.warehouseId = warehouseId;
      if (target === 'selected') body.userIds = userIds.split(',').map((s) => s.trim()).filter(Boolean);

      const data = await apiFetch<{ sent: number }>('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setResult(data);
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-200/50">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
          </span>
          {t.nav.broadcast}
        </h1>
        <p className="mt-1 text-sm text-slate-500 ml-[52px]">
          Отправка push-уведомлений через Telegram выбранным группам пользователей
        </p>
      </div>

      {/* Form card */}
      <div className="max-w-lg bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all space-y-5">

        {/* Target selector — radio-style option buttons */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Получатели
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTarget(opt.value)}
                className={[
                  'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
                  target === opt.value
                    ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-xs font-semibold',
                    target === opt.value ? 'text-blue-700' : 'text-slate-700',
                  ].join(' ')}
                >
                  {opt.label}
                </span>
                <span
                  className={[
                    'text-[11px] leading-tight',
                    target === opt.value ? 'text-blue-500' : 'text-slate-400',
                  ].join(' ')}
                >
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Conditional: warehouse ID */}
        {target === 'warehouse' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              ID склада
            </label>
            <input
              type="text"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              placeholder="uuid склада"
              className={`${inputClass} font-mono`}
            />
          </div>
        )}

        {/* Conditional: user IDs */}
        {target === 'selected' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              ID пользователей{' '}
              <span className="font-normal text-slate-400">(через запятую)</span>
            </label>
            <textarea
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              rows={2}
              placeholder="uuid1, uuid2, uuid3"
              className={`${inputClass} font-mono resize-none`}
            />
          </div>
        )}

        {/* Message textarea */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Сообщение
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Текст уведомления..."
            className={`${inputClass} resize-none`}
          />
          {message.trim().length > 0 && (
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {message.trim().length} симв.
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success message */}
        {result && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-emerald-700">
              Отправлено уведомлений:{' '}
              <span className="font-semibold">{result.sent}</span>
            </p>
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Отправка...
            </span>
          ) : (
            'Отправить'
          )}
        </button>
      </div>
    </div>
  );
}
