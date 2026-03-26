'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface BoxResult {
  id: string;
  boxCode: string;
  status: string;
  customerId: string;
  finalPrice: number | null;
  currency: string;
  weightKg: number | null;
}

const statusLabels: Record<string, string> = {
  REQUESTED: 'Запрошена',
  PACKED: 'Упакована',
  IN_TRANSIT: 'В пути',
  CUSTOMS: 'Таможня',
  ARRIVED: 'Прибыла',
  READY: 'Готова к выдаче',
  DELIVERED: 'Выдана',
};

export default function AdminBoxesPage() {
  const [query, setQuery] = useState('');
  const [boxes, setBoxes] = useState<BoxResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await apiFetch<any>(`/admin/search?q=${encodeURIComponent(query.trim())}`);
      setBoxes(results.boxes || []);
    } catch {
      setBoxes([]);
    } finally {
      setSearching(false);
    }
  };

  const startEdit = (box: BoxResult) => {
    setEditingId(box.id);
    setEditPrice(box.finalPrice?.toString() || '');
  };

  const savePrice = async (boxId: string) => {
    if (!editPrice) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/boxes/${boxId}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ price: parseFloat(editPrice) }),
      });
      setBoxes((prev) =>
        prev.map((b) => b.id === boxId ? { ...b, finalPrice: parseFloat(editPrice) } : b),
      );
      setEditingId(null);
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Коробки</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Поиск по коду коробки..."
          className="flex-1 rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {searching ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {boxes.length > 0 && (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Код</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Вес, кг</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Цена</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody>
              {boxes.map((box) => (
                <tr key={box.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{box.boxCode}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
                      {statusLabels[box.status] || box.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{box.weightKg ? Number(box.weightKg).toFixed(2) : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === box.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-24 rounded border px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => savePrice(box.id)}
                          disabled={saving}
                          className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded border px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
                        >
                          X
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {box.finalPrice != null ? `${Number(box.finalPrice).toLocaleString()} ${box.currency}` : '—'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId !== box.id && (
                      <button
                        onClick={() => startEdit(box)}
                        className="rounded border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Изменить цену
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {boxes.length === 0 && query && !searching && (
        <p className="text-sm text-gray-400 text-center py-8">Коробки не найдены</p>
      )}
    </div>
  );
}
