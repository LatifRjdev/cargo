'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Cell {
  id: string;
  code: string;
  isOccupied: boolean;
  parcels: { id: string; trackingNumber: string }[];
}

export default function CellManagementPage() {
  const { t, locale } = useI18n();
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
      alert(t.common.error);
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
      alert(t.common.error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`${t.common.delete} ${code}?`)) return;
    try {
      await apiFetch(`/warehouse/cells/${id}`, { method: 'DELETE' });
      fetchCells();
    } catch {
      alert(t.common.error);
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
    <div className="space-y-6">
      {/* Styled Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t.warehouse.cells}</h1>
              <p className="text-amber-100 text-sm mt-0.5">{t.warehouse.cells}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-4">
            <div>
              <p className="text-2xl font-bold">{totalCells}</p>
              <p className="text-amber-200 text-sm">{t.common.total}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{free}</p>
              <p className="text-amber-200 text-sm">Свободно</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{occupancyPct}%</p>
              <p className="text-amber-200 text-sm">Заполненность</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse selector */}
      <div className="flex flex-wrap gap-3">
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
        >
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-amber-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t.common.total}</p>
              <p className="text-3xl font-bold mt-2 text-amber-700">{totalCells}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-red-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Занято</p>
              <p className="text-3xl font-bold mt-2 text-red-600">{occupied}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-emerald-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Свободно</p>
              <p className="text-3xl font-bold mt-2 text-emerald-600">{free}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-orange-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Заполненность</p>
              <p className="text-3xl font-bold mt-2 text-orange-700">{occupancyPct}%</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${occupancyPct > 80 ? 'bg-red-500' : occupancyPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create cells */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t.common.create}</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Код ячейки, напр. A-01-05"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
            <button
              onClick={handleCreateSingle}
              disabled={creating || !newCode.trim()}
              className="rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {t.common.create}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Пакетное создание</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={batchPrefix}
              onChange={(e) => setBatchPrefix(e.target.value)}
              placeholder="Префикс (A)"
              className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
            <input
              type="number"
              min="1"
              max="100"
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              placeholder="Кол-во"
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
            />
            <button
              onClick={handleCreateBatch}
              disabled={creating || !batchPrefix.trim() || !batchCount}
              className="rounded-xl bg-amber-600 shadow-sm shadow-amber-200 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'free', 'occupied'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              filter === f ? 'bg-amber-600 text-white shadow-sm shadow-amber-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? t.common.all : f === 'free' ? t.common.active : t.common.blocked}
          </button>
        ))}
        <span className="text-xs text-slate-400 self-center ml-2">{filtered.length} ячеек</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-600" />
          <p className="text-sm text-slate-400">{t.common.loading}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm py-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">{t.common.notFound}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {filtered.map((cell) => (
            <div
              key={cell.id}
              className={`relative group rounded-xl border p-2.5 text-center text-xs transition-all hover:shadow-sm ${
                cell.isOccupied
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
              title={cell.isOccupied ? `Занята: ${cell.parcels.map((p) => p.trackingNumber).join(', ')}` : 'Свободна'}
            >
              <span className="font-mono font-semibold">{cell.code}</span>
              <span className={`block w-2 h-2 rounded-full mx-auto mt-1 ${cell.isOccupied ? 'bg-red-500' : 'bg-emerald-500'}`} />
              {!cell.isOccupied && (
                <button
                  onClick={() => handleDelete(cell.id, cell.code)}
                  className="absolute -top-1.5 -right-1.5 hidden group-hover:flex w-5 h-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] leading-none shadow-sm"
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
