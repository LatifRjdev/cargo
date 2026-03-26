'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Warehouse {
  id: string;
  name: string;
  address: string;
}

interface Tariff {
  id: string;
  originId: string;
  destinationId: string;
  ratePerKg: number;
  minPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  origin: { name: string; address: string };
  destination: { name: string; address: string };
}

export default function AdminTariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const [formOrigin, setFormOrigin] = useState('');
  const [formDestination, setFormDestination] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formMinPrice, setFormMinPrice] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formActive, setFormActive] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [t, w] = await Promise.all([
        apiFetch<Tariff[]>('/admin/tariffs'),
        apiFetch<Warehouse[]>('/admin/warehouses'),
      ]);
      setTariffs(t);
      setWarehouses(w);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormOrigin('');
    setFormDestination('');
    setFormRate('');
    setFormMinPrice('');
    setFormCurrency('USD');
    setFormActive(true);
    setEditingId(null);
    setError('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (t: Tariff) => {
    setEditingId(t.id);
    setFormOrigin(t.originId);
    setFormDestination(t.destinationId);
    setFormRate(t.ratePerKg.toString());
    setFormMinPrice(t.minPrice.toString());
    setFormCurrency(t.currency);
    setFormActive(t.isActive);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formOrigin || !formDestination || !formRate) return;
    setSubmitLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        originId: formOrigin,
        destinationId: formDestination,
        ratePerKg: parseFloat(formRate),
        minPrice: parseFloat(formMinPrice) || 0,
        currency: formCurrency,
        isActive: formActive,
      };
      if (editingId) body.id = editingId;

      await apiFetch('/admin/tariffs', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Тарифы</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Добавить тариф
        </button>
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Откуда</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Куда</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Ставка/кг</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Мин. цена</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Валюта</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : tariffs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Тарифы не найдены</td></tr>
            ) : (
              tariffs.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{t.origin.name}</td>
                  <td className="px-4 py-3">{t.destination.name}</td>
                  <td className="px-4 py-3 text-right font-medium">{t.ratePerKg}</td>
                  <td className="px-4 py-3 text-right">{t.minPrice}</td>
                  <td className="px-4 py-3">{t.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(t)}
                      className="rounded border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Изменить
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 mx-4">
            <h2 className="text-lg font-bold mb-4">{editingId ? 'Редактировать тариф' : 'Новый тариф'}</h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Откуда (склад)</label>
                <select
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Куда (склад)</label>
                <select
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ставка за кг</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Мин. цена</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMinPrice}
                    onChange={(e) => setFormMinPrice(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Валюта</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="TJS">TJS</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded"
                    />
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
                disabled={submitLoading || !formOrigin || !formDestination || !formRate}
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
