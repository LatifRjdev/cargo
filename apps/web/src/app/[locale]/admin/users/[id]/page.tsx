'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface UserDetail {
  id: string;
  fullName: string | null;
  phone: string;
  clientCode: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  telegramChatId: string | null;
  warehouseId: string | null;
  warehouse: { id: string; name: string; address: string } | null;
  parcels: { id: string; trackingNumber: string; status: string; marketplace: string; createdAt: string }[];
  boxes: { id: string; boxCode: string; status: string; totalWeight: number; createdAt: string }[];
}

interface Warehouse {
  id: string;
  name: string;
  address: string;
}

const roleLabels: Record<string, string> = {
  CUSTOMER: 'Клиент',
  WAREHOUSE_WORKER: 'Работник склада',
  ADMIN: 'Администратор',
};

const roleOptions = [
  { value: 'CUSTOMER', label: 'Клиент' },
  { value: 'WAREHOUSE_WORKER', label: 'Работник склада' },
  { value: 'ADMIN', label: 'Администратор' },
];

const parcelStatusLabels: Record<string, string> = {
  WAITING: 'Ожидает',
  RECEIVED: 'Принята',
  IN_WAREHOUSE: 'На складе',
  IN_BOX: 'В коробке',
  REJECTED: 'Отклонена',
};

const boxStatusLabels: Record<string, string> = {
  REQUESTED: 'Запрошена',
  PACKED: 'Упакована',
  IN_TRANSIT: 'В пути',
  CUSTOMS: 'Таможня',
  ARRIVED: 'Прибыла',
  READY: 'Готова к выдаче',
  DELIVERED: 'Выдана',
};

const parcelStatusColors: Record<string, string> = {
  WAITING: 'bg-amber-50 text-amber-700',
  RECEIVED: 'bg-blue-50 text-blue-700',
  IN_WAREHOUSE: 'bg-indigo-50 text-indigo-700',
  IN_BOX: 'bg-violet-50 text-violet-700',
  REJECTED: 'bg-red-50 text-red-700',
};

const boxStatusColors: Record<string, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700',
  PACKED: 'bg-blue-50 text-blue-700',
  IN_TRANSIT: 'bg-indigo-50 text-indigo-700',
  CUSTOMS: 'bg-orange-50 text-orange-700',
  ARRIVED: 'bg-teal-50 text-teal-700',
  READY: 'bg-emerald-50 text-emerald-700',
  DELIVERED: 'bg-slate-100 text-slate-600',
};

export default function AdminUserDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch<UserDetail>(`/admin/users/${userId}`),
      apiFetch<Warehouse[]>('/admin/warehouses'),
    ])
      .then(([userData, warehouseData]) => {
        setUser(userData);
        setSelectedRole(userData.role);
        setSelectedWarehouse(userData.warehouseId || '');
        setWarehouses(warehouseData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRoleUpdate = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: selectedRole,
          warehouseId: selectedRole === 'WAREHOUSE_WORKER' ? selectedWarehouse || undefined : undefined,
        }),
      });
      const updated = await apiFetch<UserDetail>(`/admin/users/${userId}`);
      setUser(updated);
    } catch {
      alert('Ошибка при обновлении роли');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async () => {
    if (!user) return;
    const action = user.isActive ? 'заблокировать' : 'разблокировать';
    if (!confirm(`Вы уверены, что хотите ${action} этого пользователя?`)) return;
    try {
      await apiFetch(`/admin/users/${userId}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const updated = await apiFetch<UserDetail>(`/admin/users/${userId}`);
      setUser(updated);
    } catch {
      alert('Ошибка');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <span className="text-sm text-slate-400">{t.common.loading}</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-500">{t.common.notFound}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => router.push(`/${locale}/admin/users`)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {t.common.back}
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-600">
              {(user.fullName || user.phone).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user.fullName || user.phone}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                {user.clientCode && (
                  <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600">
                    {user.clientCode}
                  </span>
                )}
                <span className="text-sm text-slate-500">{user.phone}</span>
                {user.telegramChatId && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                    Telegram
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${user.isActive ? 'text-emerald-700' : 'text-red-600'}`}>
              {user.isActive ? t.common.active : t.common.blocked}
            </span>
          </div>
        </div>
      </div>

      {/* Role & Info Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role management */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">Управление ролью</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Роль</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {selectedRole === 'WAREHOUSE_WORKER' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Склад</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                >
                  <option value="">Не выбран</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleRoleUpdate}
              disabled={saving || selectedRole === user.role}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t.common.saving}
                </>
              ) : t.common.save}
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-5">Информация</h2>
          <div className="space-y-3">
            {[
              { label: 'Текущая роль', value: roleLabels[user.role] || user.role },
              { label: 'Склад', value: user.warehouse ? user.warehouse.name : '—' },
              { label: 'Дата регистрации', value: new Date(user.createdAt).toLocaleDateString('ru-RU') },
              { label: 'Telegram', value: user.telegramChatId ? 'Подключён' : 'Не подключён' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-medium text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={toggleBlock}
              className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                user.isActive
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {user.isActive ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Parcels */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Последние посылки</h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">{user.parcels.length}</span>
          </div>
        </div>
        {user.parcels.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-400">Нет посылок</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Трекинг</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Статус</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Маркетплейс</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {user.parcels.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-medium text-slate-900">{p.trackingNumber}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${parcelStatusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                        {parcelStatusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{p.marketplace || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Boxes */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Последние коробки</h2>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">{user.boxes.length}</span>
          </div>
        </div>
        {user.boxes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-400">Нет коробок</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Код</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Статус</th>
                  <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Вес, кг</th>
                  <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {user.boxes.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900">{b.boxCode}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${boxStatusColors[b.status] || 'bg-slate-100 text-slate-600'}`}>
                        {boxStatusLabels[b.status] || b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums text-slate-700">{Number(b.totalWeight).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{new Date(b.createdAt).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
