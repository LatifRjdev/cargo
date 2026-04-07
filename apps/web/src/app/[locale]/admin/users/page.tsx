'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface User {
  id: string; fullName: string | null; phone: string; clientCode: string | null;
  role: string; isActive: boolean; createdAt: string; warehouseId: string | null;
  warehouse: { name: string } | null;
}

const roleLabels: Record<string, string> = { CUSTOMER: 'Клиент', WAREHOUSE_WORKER: 'Работник', ADMIN: 'Админ' };
const roleColors: Record<string, string> = { CUSTOMER: 'bg-blue-50 text-blue-700 border-blue-200', WAREHOUSE_WORKER: 'bg-purple-50 text-purple-700 border-purple-200', ADMIN: 'bg-red-50 text-red-700 border-red-200' };

export default function AdminUsersPage() {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState('WAREHOUSE_WORKER');
  const [createWarehouse, setCreateWarehouse] = useState('');
  const [creating, setCreating] = useState(false);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const limit = 20;

  useEffect(() => { apiFetch<any[]>('/admin/warehouses').then((w) => setWarehouses(w.map((x: any) => ({ id: x.id, name: x.name })))).catch(() => {}); }, []);

  const handleCreate = async () => {
    if (!createName.trim() || !createPhone.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/admin/users', { method: 'POST', body: JSON.stringify({ fullName: createName.trim(), phone: createPhone.trim(), role: createRole, warehouseId: createWarehouse || undefined }) });
      setShowCreateModal(false); setCreateName(''); setCreatePhone(''); setCreateRole('WAREHOUSE_WORKER'); setCreateWarehouse(''); fetchUsers();
    } catch { alert('Ошибка при создании'); } finally { setCreating(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); params.set('page', page.toString()); params.set('limit', limit.toString());
      if (roleFilter) params.set('role', roleFilter); if (activeFilter) params.set('active', activeFilter); if (search.trim()) params.set('search', search.trim());
      if (dateFrom) params.set('from', dateFrom); if (dateTo) params.set('to', dateTo);
      const data = await apiFetch<{ items: User[]; total: number }>(`/admin/users?${params}`);
      setUsers(data.items); setTotal(data.total);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, activeFilter, dateFrom, dateTo]);

  const handleSearch = () => { setPage(1); fetchUsers(); };

  const toggleBlock = async (user: User) => {
    if (!confirm(`${user.isActive ? 'Заблокировать' : 'Разблокировать'} ${user.fullName || user.phone}?`)) return;
    try { await apiFetch(`/admin/users/${user.id}/block`, { method: 'PATCH', body: JSON.stringify({ isActive: !user.isActive }) }); fetchUsers(); } catch {}
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </span>
            {t.nav.users}
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">{total} {t.admin.usersInSystem}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {t.admin.createWorker}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t.admin.searchByNamePhoneCode}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
            <option value="">{t.admin.allRoles}</option>
            <option value="CUSTOMER">{t.admin.customers}</option>
            <option value="WAREHOUSE_WORKER">{t.admin.workers}</option>
            <option value="ADMIN">{t.admin.admins}</option>
          </select>
          <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
            <option value="">{t.admin.allStatuses}</option>
            <option value="true">{t.admin.activeUsers}</option>
            <option value="false">{t.admin.blockedUsers}</option>
          </select>
          <input
            type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="От"
          />
          <input
            type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            placeholder="До"
          />
          <button onClick={handleSearch} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors">{t.common.find}</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.admin.user}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.phone}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.admin.code}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.admin.role}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.admin.warehouseLabel}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.status}</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.date}</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center"><div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                      <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-400">{t.common.notFound}</p>
                  </div>
                </td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <a href={`/${locale}/admin/users/${user.id}`} className="flex items-center gap-3 group">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${user.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                          {(user.fullName || user.phone || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{user.fullName || '—'}</span>
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{user.phone}</td>
                    <td className="px-5 py-3.5"><span className="font-mono text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{user.clientCode || '—'}</span></td>
                    <td className="px-5 py-3.5"><span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${roleColors[user.role] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{roleLabels[user.role] || user.role}</span></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{user.warehouse?.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        {user.isActive ? t.common.active : t.common.blocked}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={`/${locale}/admin/users/${user.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">{t.common.open}</a>
                        <button onClick={() => toggleBlock(user)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                          {user.isActive ? 'Блок' : 'Разблок'}
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
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">{t.common.page} {page} {t.common.of} {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">{t.common.prev}</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors">{t.common.forward}</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-300/30 w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">{t.admin.createWorker}</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.admin.fullName}</label>
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.common.phone}</label>
                <input type="text" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="+992..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.admin.role}</label>
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                  <option value="WAREHOUSE_WORKER">Работник склада</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>
              {createRole === 'WAREHOUSE_WORKER' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{t.admin.warehouseLabel}</label>
                  <select value={createWarehouse} onChange={(e) => setCreateWarehouse(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white">
                    <option value="">{t.admin.selectWarehouse}</option>
                    {warehouses.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white transition-colors">{t.common.cancel}</button>
              <button onClick={handleCreate} disabled={creating || !createName.trim() || !createPhone.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all">{creating ? t.common.creating : t.common.create}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
