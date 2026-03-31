'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Organization {
  id: string;
  name: string;
  bin: string | null;
  creditLimit: number;
  currentDebt: number;
  contactPhone: string | null;
  isActive: boolean;
  _count: { members: number; orgTariffs: number };
}

interface OrgDetail extends Organization {
  members: { id: string; fullName: string | null; phone: string; clientCode: string | null }[];
  orgTariffs: {
    tariff: { id: string; origin: { name: string }; destination: { name: string } };
    ratePerKg: number | null;
    discountPct: number | null;
  }[];
}

export default function OrganizationsPage() {
  const { t, locale } = useI18n();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formName, setFormName] = useState('');
  const [formBin, setFormBin] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('0');
  const [formPhone, setFormPhone] = useState('');
  const [formActive, setFormActive] = useState(true);

  // Add member
  const [addMemberUserId, setAddMemberUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Organization[]>('/admin/organizations');
      setOrgs(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await apiFetch<OrgDetail>(`/admin/organizations/${id}`);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
    } else {
      setExpandedId(id);
      fetchDetail(id);
    }
  };

  const resetForm = () => {
    setFormName(''); setFormBin(''); setFormCreditLimit('0');
    setFormPhone(''); setFormActive(true); setEditingId(null); setError('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (o: Organization) => {
    setEditingId(o.id);
    setFormName(o.name);
    setFormBin(o.bin || '');
    setFormCreditLimit(o.creditLimit.toString());
    setFormPhone(o.contactPhone || '');
    setFormActive(o.isActive);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formName) return;
    setSubmitLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: formName,
        bin: formBin || undefined,
        creditLimit: parseFloat(formCreditLimit) || 0,
        contactPhone: formPhone || undefined,
        isActive: formActive,
      };
      if (editingId) body.id = editingId;
      await apiFetch('/admin/organizations', { method: 'POST', body: JSON.stringify(body) });
      setShowModal(false);
      resetForm();
      fetchOrgs();
    } catch (err: any) {
      setError(err.message || 'Ошибка');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAddMember = async (orgId: string) => {
    if (!addMemberUserId.trim()) return;
    setAddingMember(true);
    try {
      await apiFetch(`/admin/organizations/${orgId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId: addMemberUserId.trim() }),
      });
      setAddMemberUserId('');
      fetchDetail(orgId);
    } catch {
      alert('Ошибка добавления');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (orgId: string, userId: string) => {
    if (!confirm('Убрать участника из организации?')) return;
    try {
      await apiFetch(`/admin/organizations/${orgId}/members/${userId}`, { method: 'DELETE' });
      fetchDetail(orgId);
    } catch {
      alert('Ошибка');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </span>
            Организации (B2B)
          </h1>
          <p className="mt-1 text-sm text-slate-500 ml-[52px]">Управление корпоративными клиентами и их участниками</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Добавить организацию
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="h-8 w-8 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : orgs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">Организаций пока нет</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map((o) => (
            <div
              key={o.id}
              className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all${!o.isActive ? ' opacity-60' : ''}`}
            >
              {/* Row header */}
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 rounded-2xl transition-colors"
                onClick={() => toggleExpand(o.id)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-slate-900 truncate">{o.name}</h3>
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                      o.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}>
                      {o.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-slate-500">
                    {o.bin && <span>ИНН: {o.bin}</span>}
                    {o.contactPhone && <span>{o.contactPhone}</span>}
                    <span>{o._count.members} участников</span>
                    <span>{o._count.orgTariffs} тарифов</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-0.5">Лимит / Долг</p>
                    <p className="text-sm font-medium text-slate-700">
                      ${Number(o.creditLimit).toLocaleString()}
                      <span className="text-slate-400 mx-1">/</span>
                      <span className={Number(o.currentDebt) > 0 ? 'text-red-500' : 'text-slate-700'}>
                        ${Number(o.currentDebt).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(o); }}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                  >
                    {t.common.edit}
                  </button>
                  <span className={`text-slate-400 transition-transform duration-200 text-xs ${expandedId === o.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === o.id && (
                <div className="border-t border-slate-100 px-5 py-5">
                  {detailLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Загрузка...
                    </div>
                  ) : detail ? (
                    <div className="space-y-5">

                      {/* Members section */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Участники</h4>
                        {detail.members.length === 0 ? (
                          <p className="text-xs text-slate-400">Нет участников</p>
                        ) : (
                          <div className="space-y-1.5 mb-3">
                            {detail.members.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
                              >
                                <span className="flex items-center gap-2">
                                  <a
                                    href={`/${locale}/admin/users/${m.id}`}
                                    className="font-medium text-blue-600 hover:underline"
                                  >
                                    {m.fullName || m.phone}
                                  </a>
                                  {m.clientCode && (
                                    <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-mono text-slate-500">
                                      {m.clientCode}
                                    </span>
                                  )}
                                </span>
                                <button
                                  onClick={() => handleRemoveMember(o.id, m.id)}
                                  className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                                >
                                  Убрать
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add member input */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={addMemberUserId}
                            onChange={(e) => setAddMemberUserId(e.target.value)}
                            placeholder="ID пользователя"
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                          />
                          <button
                            onClick={() => handleAddMember(o.id)}
                            disabled={addingMember}
                            className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
                          >
                            {addingMember ? '...' : t.common.add}
                          </button>
                        </div>
                      </div>

                      {/* Org tariffs section */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Специальные тарифы</h4>
                        {detail.orgTariffs.length === 0 ? (
                          <p className="text-xs text-slate-400">Стандартные тарифы</p>
                        ) : (
                          <div className="space-y-1.5">
                            {detail.orgTariffs.map((ot) => (
                              <div
                                key={ot.tariff.id}
                                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
                              >
                                <span className="font-medium text-slate-700">
                                  {ot.tariff.origin.name}
                                  <span className="mx-1.5 text-slate-400">→</span>
                                  {ot.tariff.destination.name}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                                  {ot.ratePerKg != null && (
                                    <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-medium">
                                      ${Number(ot.ratePerKg)}/кг
                                    </span>
                                  )}
                                  {ot.discountPct != null && (
                                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-emerald-700 font-medium">
                                      скидка {Number(ot.discountPct)}%
                                    </span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">Ошибка загрузки данных</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl shadow-slate-300/30 overflow-hidden">

            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {editingId ? 'Редактировать организацию' : 'Новая организация'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {editingId ? 'Измените данные организации' : 'Заполните данные для создания организации'}
              </p>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="rounded-lg bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Название</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">ИНН / BIN</label>
                <input
                  type="text"
                  value={formBin}
                  onChange={(e) => setFormBin(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Кредитный лимит ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Телефон</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                />
                <span className="text-sm font-medium text-slate-700">Активна</span>
              </label>
            </div>

            {/* Modal footer */}
            <div className="flex gap-2.5 px-6 py-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-all"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading || !formName}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {submitLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t.common.saving}
                  </span>
                ) : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
