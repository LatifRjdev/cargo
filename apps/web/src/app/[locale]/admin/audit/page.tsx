'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  createdAt: string;
  user: { id: string; fullName: string | null } | null;
}

const actionLabels: Record<string, string> = {
  intake: 'Приёмка',
  intake_unidentified: 'Приёмка (неопознанная)',
  reject: 'Отклонение',
  pack: 'Упаковка',
  ship: 'Отправка',
  deliver: 'Выдача',
  pay: 'Оплата',
  status_change: 'Смена статуса',
  create: 'Создание',
  update: 'Обновление',
  delete: 'Удаление',
};

const entityLabels: Record<string, string> = {
  parcel: 'Посылка',
  box: 'Коробка',
  batch: 'Рейс',
  user: 'Пользователь',
  tariff: 'Тариф',
  warehouse: 'Склад',
  setting: 'Настройка',
  payment: 'Оплата',
};

const actionColors: Record<string, string> = {
  intake: 'bg-green-100 text-green-700',
  pack: 'bg-blue-100 text-blue-700',
  ship: 'bg-purple-100 text-purple-700',
  deliver: 'bg-emerald-100 text-emerald-700',
  pay: 'bg-yellow-100 text-yellow-700',
  reject: 'bg-red-100 text-red-700',
};

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const limit = 30;

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);

      const data = await apiFetch<{ items: AuditEntry[]; total: number }>(`/admin/audit-log?${params}`);
      setEntries(data.items);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAudit(); }, [page, actionFilter, entityFilter]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Аудит-лог</h1>
        <span className="text-sm text-gray-500">Всего: {total}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все действия</option>
          {Object.entries(actionLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все объекты</option>
          {Object.entries(entityLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Пользователь</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действие</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Объект</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ID объекта</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Детали</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Записи не найдены</td></tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    {e.user ? (
                      <a href={`/ru/admin/users/${e.user.id}`} className="text-blue-600 hover:underline text-xs">
                        {e.user.fullName || e.user.id.slice(0, 8)}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[e.action] || 'bg-gray-100 text-gray-700'}`}>
                      {actionLabels[e.action] || e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {entityLabels[e.entityType] || e.entityType}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[120px] truncate">
                    {e.entityId}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                    {e.details ? JSON.stringify(e.details) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">Стр. {page} из {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Назад
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
