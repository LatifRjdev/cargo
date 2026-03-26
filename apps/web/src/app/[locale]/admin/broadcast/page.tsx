'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

type Target = 'all' | 'warehouse' | 'selected';

export default function BroadcastPage() {
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Рассылка уведомлений</h1>

      <div className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Получатели</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все пользователи (с Telegram)</option>
            <option value="warehouse">Пользователи склада</option>
            <option value="selected">Выбранные (по ID)</option>
          </select>
        </div>

        {target === 'warehouse' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">ID склада</label>
            <input
              type="text"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              placeholder="uuid склада"
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {target === 'selected' && (
          <div>
            <label className="block text-sm text-gray-600 mb-1">ID пользователей (через запятую)</label>
            <textarea
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              rows={2}
              placeholder="uuid1, uuid2, uuid3"
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-600 mb-1">Сообщение</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Текст уведомления..."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            Отправлено уведомлений: {result.sent}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {sending ? 'Отправка...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}
