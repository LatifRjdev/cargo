'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

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

export default function AdminUserDetailPage() {
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
    return <div className="flex items-center justify-center py-20"><p className="text-gray-500">Загрузка...</p></div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center py-20"><p className="text-red-500">Пользователь не найден</p></div>;
  }

  return (
    <div>
      <button onClick={() => router.push('/ru/admin/users')} className="text-sm text-blue-600 hover:underline mb-4 block">
        &larr; Назад к списку
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{user.fullName || user.phone}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.clientCode && <span className="font-mono mr-3">{user.clientCode}</span>}
            {user.phone}
            {user.telegramChatId && <span className="ml-3 text-green-600">Telegram подключён</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">{user.isActive ? 'Активен' : 'Заблокирован'}</span>
        </div>
      </div>

      {/* Role & Actions */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Управление ролью</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Роль</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {selectedRole === 'WAREHOUSE_WORKER' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Склад</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Сохранение...' : 'Сохранить роль'}
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Информация</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Текущая роль</span>
              <span className="font-medium">{roleLabels[user.role] || user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Склад</span>
              <span>{user.warehouse ? user.warehouse.name : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Дата регистрации</span>
              <span>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Telegram</span>
              <span>{user.telegramChatId ? 'Подключён' : 'Не подключён'}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <button
              onClick={toggleBlock}
              className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                user.isActive
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }`}
            >
              {user.isActive ? 'Заблокировать пользователя' : 'Разблокировать пользователя'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Parcels */}
      <div className="rounded-lg border bg-white p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Последние посылки ({user.parcels.length})</h2>
        {user.parcels.length === 0 ? (
          <p className="text-sm text-gray-400">Нет посылок</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Трекинг</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Статус</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Маркетплейс</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Дата</th>
                </tr>
              </thead>
              <tbody>
                {user.parcels.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{p.trackingNumber}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{parcelStatusLabels[p.status] || p.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{p.marketplace || '—'}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Boxes */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Последние коробки ({user.boxes.length})</h2>
        {user.boxes.length === 0 ? (
          <p className="text-sm text-gray-400">Нет коробок</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Код</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Статус</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600">Вес, кг</th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">Дата</th>
                </tr>
              </thead>
              <tbody>
                {user.boxes.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs font-medium">{b.boxCode}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{boxStatusLabels[b.status] || b.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right">{Number(b.totalWeight).toFixed(2)}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{new Date(b.createdAt).toLocaleDateString('ru-RU')}</td>
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
