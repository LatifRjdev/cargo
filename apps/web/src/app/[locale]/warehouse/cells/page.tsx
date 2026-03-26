'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Cell {
  id: string;
  code: string;
  isOccupied: boolean;
  parcels: { id: string; trackingNumber: string }[];
}

export default function CellManagementPage() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState('');
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [newCode, setNewCode] = useState('');
  const [batchPrefix, setBatchPrefix] = useState('');
  const [batchCount, setBatchCount] = useState('');
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'free' | 'occupied'>('all');

  useEffect(() => {
    apiFetch<any[]>('/admin/warehouses')
      .then((w) => {
        const list = w.map((x: any) => ({ id: x.id, name: x.name }));
        setWarehouses(list);
        if (list.length > 0) setWarehouseId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchCells = async () => {
    if (!warehouseId) return;
    setLoading(true);
    try {
      const data = await apiFetch<Cell[]>(`/warehouse/cells?warehouseId=${warehouseId}`);
      setCells(data);
    } catch {
      setCells([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (warehouseId) fetchCells();
  }, [warehouseId]);

  const handleCreateSingle = async () => {
    if (!newCode.trim() || !warehouseId) return;
    setCreating(true);
    try {
      await apiFetch('/warehouse/cells', {
        method: 'POST',
        body: JSON.stringify({ warehouseId, code: newCode.trim() }),
      });
      setNewCode('');
      fetchCells();
    } catch {
      alert('Ошибка при создании ячейки');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!batchPrefix.trim() || !batchCount || !warehouseId) return;
    setCreating(true);
    try {
      await apiFetch('/warehouse/cells/batch', {
        method: 'POST',
        body: JSON.stringify({ warehouseId, prefix: batchPrefix.trim(), count: parseInt(batchCount) }),
      });
      setBatchPrefix('');
      setBatchCount('');
      fetchCells();
    } catch {
      alert('Ошибка при создании ячеек');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Удалить ячейку ${code}?`)) return;
    try {
      await apiFetch(`/warehouse/cells/${id}`, { method: 'DELETE' });
      fetchCells();
    } catch {
      alert('Нельзя удалить занятую ячейку');
    }
  };

  const filtered = cells.filter((c) => {
    if (filter === 'free') return !c.isOccupied;
    if (filter === 'occupied') return c.isOccupied;
    return true;
  });

  const totalCells = cells.length;
  const occupied = cells.filter((c) => c.isOccupied).length;
  const free = totalCells - occupied;
  const occupancyPct = totalCells > 0 ? Math.round((occupied / totalCells) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Управление ячейками</h1>

      {/* Warehouse selector */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Всего ячеек</p>
          <p className="text-2xl font-bold">{totalCells}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Занято</p>
          <p className="text-2xl font-bold text-red-600">{occupied}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Свободно</p>
          <p className="text-2xl font-bold text-green-600">{free}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-gray-500">Заполненность</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{occupancyPct}%</p>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${occupancyPct > 80 ? 'bg-red-500' : occupancyPct > 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create cells */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold mb-3">Создать ячейку</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Код ячейки, напр. A-01-05"
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateSingle}
              disabled={creating || !newCode.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Создать
            </button>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold mb-3">Пакетное создание</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={batchPrefix}
              onChange={(e) => setBatchPrefix(e.target.value)}
              placeholder="Префикс (A)"
              className="w-28 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              min="1"
              max="100"
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              placeholder="Кол-во"
              className="w-24 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateBatch}
              disabled={creating || !batchPrefix.trim() || !batchCount}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Создать пакет
            </button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'free', 'occupied'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Все' : f === 'free' ? 'Свободные' : 'Занятые'}
          </button>
        ))}
        <span className="text-xs text-gray-400 self-center ml-2">{filtered.length} ячеек</span>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-gray-500 py-8 text-center">Загрузка...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 py-8 text-center">Ячейки не найдены</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {filtered.map((cell) => (
            <div
              key={cell.id}
              className={`relative group rounded-lg border p-2 text-center text-xs transition-colors ${
                cell.isOccupied
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}
              title={cell.isOccupied ? `Занята: ${cell.parcels.map((p) => p.trackingNumber).join(', ')}` : 'Свободна'}
            >
              <span className="font-mono font-medium">{cell.code}</span>
              <span className={`block w-2 h-2 rounded-full mx-auto mt-1 ${cell.isOccupied ? 'bg-red-500' : 'bg-green-500'}`} />
              {!cell.isOccupied && (
                <button
                  onClick={() => handleDelete(cell.id, cell.code)}
                  className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] leading-none"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
