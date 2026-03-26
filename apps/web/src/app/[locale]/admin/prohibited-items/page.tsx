'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ProhibitedItemsPage() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<string[]>('/admin/prohibited-items');
      setItems(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      await apiFetch('/admin/prohibited-items', {
        method: 'POST',
        body: JSON.stringify({ item: newItem.trim() }),
      });
      setNewItem('');
      fetchItems();
    } catch {
      alert('Ошибка при добавлении');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (item: string) => {
    if (!confirm(`Удалить "${item}" из списка?`)) return;
    try {
      await apiFetch('/admin/prohibited-items', {
        method: 'DELETE',
        body: JSON.stringify({ item }),
      });
      fetchItems();
    } catch {
      // silent
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Запрещённые товары</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Название товара..."
          className="flex-1 max-w-md rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newItem.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {adding ? '...' : 'Добавить'}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-400">Список пуст</p>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {items.map((item) => (
            <div key={item} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{item}</span>
              <button
                onClick={() => handleRemove(item)}
                className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
