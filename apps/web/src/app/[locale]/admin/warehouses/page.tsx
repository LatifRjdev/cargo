'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

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

export default function AdminWarehousesPage() {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Склады</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Добавить склад
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><p className="text-gray-500">Загрузка...</p></div>
      ) : warehouses.length === 0 ? (
        <div className="flex items-center justify-center py-20"><p className="text-gray-500">Склады не найдены</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {warehouses.map((w) => (
            <div key={w.id} className={`rounded-lg border bg-white p-5 ${!w.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{w.name}</h3>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">{w.address}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${w.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {w.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </div>

              <div className="text-xs text-gray-500 space-y-1 mb-3">
                <p>{typeLabels[w.type] || w.type}</p>
                {w.phone && <p>{w.phone}</p>}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center border-t pt-3">
                <div>
                  <p className="text-lg font-bold">{w._count.cells}</p>
                  <p className="text-xs text-gray-500">Ячеек</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{w._count.parcels}</p>
                  <p className="text-xs text-gray-500">Посылок</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{w._count.boxes}</p>
                  <p className="text-xs text-gray-500">Коробок</p>
                </div>
              </div>

              <button
                onClick={() => openEdit(w)}
                className="mt-3 w-full rounded-lg border px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
              >
                Редактировать
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 mx-4">
            <h2 className="text-lg font-bold mb-4">{editingId ? 'Редактировать склад' : 'Новый склад'}</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Название</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Склад Гуанчжоу"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Адрес</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="г. Гуанчжоу, район Байюнь, ул. ..."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Телефон</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Тип</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ORIGIN">Отправка</option>
                    <option value="DESTINATION">Приёмка</option>
                    <option value="TRANSIT">Транзит</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="rounded" />
                    Активен
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading || !formName || !formAddress}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
