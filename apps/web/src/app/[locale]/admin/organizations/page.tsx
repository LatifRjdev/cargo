'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Организации (B2B)</h1>
        <button onClick={openCreate} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Добавить организацию
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><p className="text-gray-500">Загрузка...</p></div>
      ) : orgs.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">Организаций нет</div>
      ) : (
        <div className="space-y-3">
          {orgs.map((o) => (
            <div key={o.id} className={`rounded-lg border bg-white ${!o.isActive ? 'opacity-60' : ''}`}>
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(o.id)}
              >
                <div>
                  <h3 className="font-semibold">{o.name}</h3>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    {o.bin && <span>ИНН: {o.bin}</span>}
                    {o.contactPhone && <span>{o.contactPhone}</span>}
                    <span>{o._count.members} участников</span>
                    <span>{o._count.orgTariffs} тарифов</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Лимит / Долг</p>
                    <p className="text-sm font-medium">
                      ${Number(o.creditLimit).toLocaleString()} / <span className={Number(o.currentDebt) > 0 ? 'text-red-600' : ''}>${Number(o.currentDebt).toLocaleString()}</span>
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(o); }}
                    className="rounded border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    Изменить
                  </button>
                  <span className="text-gray-400">{expandedId === o.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expandedId === o.id && (
                <div className="border-t px-5 py-4">
                  {detailLoading ? (
                    <p className="text-sm text-gray-400">Загрузка...</p>
                  ) : detail ? (
                    <div className="space-y-4">
                      {/* Members */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Участники</h4>
                        {detail.members.length === 0 ? (
                          <p className="text-xs text-gray-400">Нет участников</p>
                        ) : (
                          <div className="space-y-1">
                            {detail.members.map((m) => (
                              <div key={m.id} className="flex items-center justify-between text-sm">
                                <span>
                                  <a href={`/ru/admin/users/${m.id}`} className="text-blue-600 hover:underline">{m.fullName || m.phone}</a>
                                  {m.clientCode && <span className="text-gray-400 ml-2 text-xs font-mono">{m.clientCode}</span>}
                                </span>
                                <button
                                  onClick={() => handleRemoveMember(o.id, m.id)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Убрать
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={addMemberUserId}
                            onChange={(e) => setAddMemberUserId(e.target.value)}
                            placeholder="ID пользователя"
                            className="flex-1 rounded border px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleAddMember(o.id)}
                            disabled={addingMember}
                            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>

                      {/* Org Tariffs */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Специальные тарифы</h4>
                        {detail.orgTariffs.length === 0 ? (
                          <p className="text-xs text-gray-400">Стандартные тарифы</p>
                        ) : (
                          <div className="space-y-1">
                            {detail.orgTariffs.map((ot) => (
                              <div key={ot.tariff.id} className="flex items-center justify-between text-sm">
                                <span>{ot.tariff.origin.name} → {ot.tariff.destination.name}</span>
                                <span className="text-xs text-gray-500">
                                  {ot.ratePerKg != null && `$${Number(ot.ratePerKg)}/кг`}
                                  {ot.discountPct != null && ` (скидка ${Number(ot.discountPct)}%)`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">Ошибка загрузки</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 mx-4">
            <h2 className="text-lg font-bold mb-4">{editingId ? 'Редактировать организацию' : 'Новая организация'}</h2>

            {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Название</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">ИНН / BIN</label>
                <input type="text" value={formBin} onChange={(e) => setFormBin(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Кредитный лимит ($)</label>
                  <input type="number" step="0.01" value={formCreditLimit} onChange={(e) => setFormCreditLimit(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Телефон</label>
                  <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded" />
                Активна
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Отмена</button>
              <button onClick={handleSubmit} disabled={submitLoading || !formName}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {submitLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
