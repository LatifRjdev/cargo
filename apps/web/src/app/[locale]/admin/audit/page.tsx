'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

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
  const { t, locale } = useI18n();
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            Аудит-лог
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">История всех действий в системе</p>
        </div>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">Всего записей: {total}</span>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="flex flex-wrap gap-3">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-slate-700"
          >
            <option value="">Все действия</option>
            {Object.entries(actionLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white text-slate-700"
          >
            <option value="">Все объекты</option>
            {Object.entries(entityLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => { setPage(1); fetchAudit(); }}
            className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            {t.common.apply}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50 px-5 py-3">Дата</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50 px-5 py-3">Пользователь</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50 px-5 py-3">Действие</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50 px-5 py-3">Объект</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50 px-5 py-3">ID объекта</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50 px-5 py-3">Детали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                      <span className="text-sm">Загрузка...</span>
                    </div>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">Записи не найдены</p>
                    </div>
                  </td>
                </tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-5 py-3">
                      {e.user ? (
                        <a href={`/${locale}/admin/users/${e.user.id}`} className="text-blue-600 hover:underline text-xs">
                          {e.user.fullName || e.user.id.slice(0, 8)}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColors[e.action] || 'bg-slate-100 text-slate-700'}`}>
                        {actionLabels[e.action] || e.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-700">
                      {entityLabels[e.entityType] || e.entityType}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 max-w-[120px] truncate">
                      {e.entityId}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-[200px] truncate">
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
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">{t.common.page} {page} {t.common.of} {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                {t.common.prev}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                {t.common.forward}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
