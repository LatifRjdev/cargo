'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Warehouse {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  type: string;
  isActive: boolean;
  _count: { cells: number; parcels: number; boxes: number };
}

const typeLabels: Record<string, string> = {
  ORIGIN: 'Отправка (Китай)',
  DESTINATION: 'Приёмка (Душанбе)',
  TRANSIT: 'Транзит',
};

const typeBadgeStyles: Record<string, string> = {
  ORIGIN: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  DESTINATION: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/60',
  TRANSIT: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
};

export default function AdminWarehousesPage() {
  const { t, locale } = useI18n();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState('ORIGIN');
  const [formActive, setFormActive] = useState(true);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Warehouse[]>('/admin/warehouses');
      setWarehouses(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const resetForm = () => {
    setFormName(''); setFormAddress(''); setFormPhone('');
    setFormType('ORIGIN'); setFormActive(true); setEditingId(null); setError('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (w: Warehouse) => {
    setEditingId(w.id);
    setFormName(w.name);
    setFormAddress(w.address);
    setFormPhone(w.phone || '');
    setFormType(w.type);
    setFormActive(w.isActive);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formName || !formAddress) return;
    setSubmitLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: formName,
        address: formAddress,
        phone: formPhone || undefined,
        type: formType,
        isActive: formActive,
      };
      if (editingId) body.id = editingId;

      await apiFetch('/admin/warehouses', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowModal(false);
      resetForm();
      fetchWarehouses();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </span>
            {t.nav.warehouses}
          </h1>
          <p className="mt-1 text-sm text-slate-500 ml-[52px]">Управление складами и точками хранения</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Добавить склад
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-blue-500 animate-spin" />
        </div>
      ) : warehouses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">Склады не найдены</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <div
              key={w.id}
              className={`bg-white rounded-2xl border border-slate-200/80 border-t-[3px] ${w.type === 'ORIGIN' ? 'border-t-amber-500' : w.type === 'DESTINATION' ? 'border-t-blue-500' : 'border-t-violet-500'} p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all ${!w.isActive ? 'opacity-60' : ''}`}
            >
              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 pr-3">
                  <h3 className="font-semibold text-slate-900 truncate">{w.name}</h3>
                  <p className="text-sm text-slate-500 truncate mt-0.5">{w.address}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${w.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/60'}`}>
                  {w.isActive ? t.common.active : 'Неактивен'}
                </span>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadgeStyles[w.type] ?? 'bg-slate-100 text-slate-600'}`}>
                  {typeLabels[w.type] || w.type}
                </span>
                {w.phone && (
                  <span className="text-xs text-slate-500">{w.phone}</span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-4 mb-4">
                <div>
                  <p className="text-lg font-bold text-slate-900">{w._count.cells}</p>
                  <p className="text-xs text-slate-500">Ячеек</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{w._count.parcels}</p>
                  <p className="text-xs text-slate-500">Посылок</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{w._count.boxes}</p>
                  <p className="text-xs text-slate-500">Коробок</p>
                </div>
              </div>

              <button
                onClick={() => openEdit(w)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                {t.common.edit}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {editingId ? 'Редактировать склад' : 'Новый склад'}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {editingId ? 'Измените данные склада и сохраните' : 'Заполните данные нового склада'}
              </p>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/80 p-3.5">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Название</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Склад Гуанчжоу"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Адрес</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="г. Гуанчжоу, район Байюнь, ул. ..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Телефон</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Тип</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-white"
                  >
                    <option value="ORIGIN">Отправка</option>
                    <option value="DESTINATION">Приёмка</option>
                    <option value="TRANSIT">Транзит</option>
                  </select>
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-blue-500 transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
                    </div>
                    <span className="text-sm text-slate-700">Активен</span>
                  </label>
                </div>
              </div>
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
                disabled={submitLoading || !formName || !formAddress}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {t.common.saving}
                  </>
                ) : (
                  t.common.save
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
