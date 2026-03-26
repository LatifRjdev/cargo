'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  fullName: string | null;
  phone: string;
  clientCode: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  warehouseId: string | null;
  warehouse: { name: string } | null;
}

const roleLabels: Record<string, string> = {
  CUSTOMER: 'Клиент',
  WAREHOUSE_WORKER: 'Работник склада',
  ADMIN: 'Администратор',
};

const roleColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  WAREHOUSE_WORKER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState('WAREHOUSE_WORKER');
  const [createWarehouse, setCreateWarehouse] = useState('');
  const [creating, setCreating] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const limit = 20;

  useEffect(() => {
    apiFetch<any[]>('/admin/warehouses').then((w) => setWarehouses(w.map((x: any) => ({ id: x.id, name: x.name })))).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!createName.trim() || !createPhone.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          fullName: createName.trim(),
          phone: createPhone.trim(),
          role: createRole,
          warehouseId: createWarehouse || undefined,
        }),
      });
      setShowCreateModal(false);
      setCreateName('');
      setCreatePhone('');
      setCreateRole('WAREHOUSE_WORKER');
      setCreateWarehouse('');
      fetchUsers();
    } catch {
      alert('Ошибка при создании');
    } finally {
      setCreating(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (roleFilter) params.set('role', roleFilter);
      if (activeFilter) params.set('active', activeFilter);
      if (search.trim()) params.set('search', search.trim());

      const data = await apiFetch<{ items: User[]; total: number }>(`/admin/users?${params}`);
      setUsers(data.items);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, activeFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const toggleBlock = async (user: User) => {
    const action = user.isActive ? 'Заблокировать' : 'Разблокировать';
    if (!confirm(`${action} пользователя ${user.fullName || user.phone}?`)) return;
    try {
      await apiFetch(`/admin/users/${user.id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      fetchUsers();
    } catch {
      // silent
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Всего: {total}</span>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Создать работника
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Поиск по имени, телефону, коду..."
          className="rounded-lg border px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все роли</option>
          <option value="CUSTOMER">Клиенты</option>
          <option value="WAREHOUSE_WORKER">Работники</option>
          <option value="ADMIN">Админы</option>
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все статусы</option>
          <option value="true">Активные</option>
          <option value="false">Заблокированные</option>
        </select>
        <button
          onClick={handleSearch}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Найти
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Имя</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Телефон</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Код</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Склад</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Регистрация</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Загрузка...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Пользователи не найдены</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <a href={`/ru/admin/users/${user.id}`} className="text-blue-600 hover:underline">
                      {user.fullName || '—'}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{user.clientCode || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{user.warehouse?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs">{user.isActive ? 'Активен' : 'Заблокирован'}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <a
                        href={`/ru/admin/users/${user.id}`}
                        className="rounded border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Подробнее
                      </a>
                      <button
                        onClick={() => toggleBlock(user)}
                        className={`rounded border px-2 py-1 text-xs transition-colors ${
                          user.isActive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.isActive ? 'Блокировать' : 'Разблокировать'}
                      </button>
                    </div>
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
          <p className="text-sm text-gray-500">
            Стр. {page} из {totalPages}
          </p>
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

      {/* Create Worker Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Создать работника</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">ФИО</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Телефон</label>
                <input
                  type="text"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="+992..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Роль</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WAREHOUSE_WORKER">Работник склада</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
              {createRole === 'WAREHOUSE_WORKER' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Склад</label>
                  <select
                    value={createWarehouse}
                    onChange={(e) => setCreateWarehouse(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Выберите склад —</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !createName.trim() || !createPhone.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
