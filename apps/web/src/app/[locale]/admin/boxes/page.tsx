'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

interface Box {
  id: string;
  boxCode: string;
  status: string;
  weightKg: string | null;
  billableWeight: string | null;
  finalPrice: string | null;
  estimatedPrice: string | null;
  currency: string;
  customerNote: string | null;
  shelfLocation: string | null;
  createdAt: string;
  customer: { id: string; fullName: string | null; clientCode: string | null; phone: string } | null;
  warehouse: { name: string } | null;
  batch: { batchCode: string; route: string } | null;
  _count: { parcels: number };
  payment: { id: string; status: string } | null;
  statusLog: { id: string; status: string; createdAt: string; comment: string | null }[];
}

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Заявка', PACKING: 'Упаковка', PACKED: 'Упакована', IN_TRANSIT: 'В пути',
  CUSTOMS: 'Таможня', ARRIVED: 'Прибыла', READY: 'К выдаче', DELIVERED: 'Выдана', CANCELLED: 'Отменена',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-slate-100 text-slate-600 border-slate-200',
  PACKING: 'bg-purple-50 text-purple-700 border-purple-200',
  PACKED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_TRANSIT: 'bg-amber-50 text-amber-700 border-amber-200',
  CUSTOMS: 'bg-orange-50 text-orange-700 border-orange-200',
  ARRIVED: 'bg-teal-50 text-teal-700 border-teal-200',
  READY: 'bg-green-50 text-green-700 border-green-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_BORDER: Record<string, string> = {
  REQUESTED: 'border-t-slate-400', PACKED: 'border-t-blue-500', IN_TRANSIT: 'border-t-amber-500',
  CUSTOMS: 'border-t-orange-500', ARRIVED: 'border-t-teal-500', READY: 'border-t-green-500',
  DELIVERED: 'border-t-emerald-500',
};

const STATUSES = ['', 'REQUESTED', 'PACKED', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'READY', 'DELIVERED'] as const;

export default function AdminBoxesPage() {
  const { t, locale } = useI18n();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const limit = 15;

  const fetchBoxes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiFetch<any>(`/admin/boxes?${params}`);
      setBoxes(res.items || []);
      setTotal(res.total || 0);
    } catch { setBoxes([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBoxes(); }, [page, statusFilter]);

  const savePrice = async (boxId: string) => {
    if (!editPrice) return;
    setSaving(true);
    try {
      await apiFetch(`/admin/boxes/${boxId}/price`, { method: 'PATCH', body: JSON.stringify({ price: parseFloat(editPrice) }) });
      setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, finalPrice: editPrice } : b));
      setEditingId(null);
    } catch { alert('Ошибка сохранения'); }
    finally { setSaving(false); }
  };

  const handleExport = () => {
    const csv = ['Код,Клиент,Статус,Вес,Цена,Посылок,Рейс,Дата',
      ...boxes.map(b => `${b.boxCode},${b.customer?.fullName || ''},${STATUS_LABELS[b.status] || b.status},${b.weightKg || ''},${b.finalPrice || ''},${b._count.parcels},${b.batch?.batchCode || ''},${new Date(b.createdAt).toLocaleDateString('ru-RU')}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'boxes-export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const allCount = total;
  const inTransitCount = boxes.filter(b => ['IN_TRANSIT', 'CUSTOMS'].includes(b.status)).length;
  const readyCount = boxes.filter(b => b.status === 'READY').length;
  const deliveredCount = boxes.filter(b => b.status === 'DELIVERED').length;
  const unpaidCount = boxes.filter(b => b.finalPrice && !b.payment).length;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            </span>
            {t.nav.boxes}
          </h1>
          <p className="mt-1 text-sm text-slate-500 ml-[52px]">{total} коробок в системе</p>
        </div>
        <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Экспорт CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Всего', value: allCount, color: 'blue', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
          { label: 'В пути', value: inTransitCount, color: 'amber', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.375c0-.621-.504-1.125-1.125-1.125H18M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v11.25' },
          { label: 'К выдаче', value: readyCount, color: 'green', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Выдано', value: deliveredCount, color: 'emerald', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 011.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C7.856 4.016 6.75 5.197 6.75 6.574v7.676' },
          { label: 'Не оплачены', value: unpaidCount, color: 'red', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((s) => {
          const bg = `bg-${s.color}-50`; const ic = `text-${s.color}-600`; const border = `border-t-${s.color}-500`;
          return (
            <div key={s.label} className={`bg-white rounded-2xl border border-slate-200/80 border-t-[3px] ${border} p-4 shadow-sm hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <div className={`p-2 rounded-lg ${bg}`}><svg className={`w-4 h-4 ${ic}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg></div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s || 'all'} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s ? STATUS_LABELS[s] || s : 'Все'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Коробка</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Клиент</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Статус</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Вес</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Цена</th>
                <th className="text-center px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Посылок</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Рейс</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Дата</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="py-16 text-center"><div className="flex justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /></div></td></tr>
              ) : boxes.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center text-sm text-slate-400">Коробки не найдены</td></tr>
              ) : boxes.map((box) => (
                <>
                  <tr key={box.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === box.id ? null : box.id)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === box.id ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        <span className="font-mono text-xs font-bold text-slate-800">{box.boxCode}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {box.customer ? (
                        <a href={`/${locale}/admin/users/${box.customer.id}`} onClick={(e) => e.stopPropagation()} className="group">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-blue-600">{box.customer.fullName || box.customer.phone}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{box.customer.clientCode}</p>
                        </a>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[box.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {STATUS_LABELS[box.status] || box.status}
                      </span>
                      {box.payment ? (
                        <span className="ml-1.5 inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-medium">Оплачено</span>
                      ) : box.finalPrice ? (
                        <span className="ml-1.5 inline-flex items-center rounded-md bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 text-[10px] font-medium">Не оплач.</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700 tabular-nums">{box.weightKg ? `${Number(box.weightKg).toFixed(1)} кг` : '—'}</td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {editingId === box.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" autoFocus />
                          <button onClick={() => savePrice(box.id)} disabled={saving} className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white">{saving ? '...' : 'OK'}</button>
                          <button onClick={() => setEditingId(null)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500">✕</button>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-800 tabular-nums">{box.finalPrice ? `$${Number(box.finalPrice).toFixed(2)}` : '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center"><span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{box._count.parcels}</span></td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{box.batch ? <span className="font-mono">{box.batch.batchCode}</span> : '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(box.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {editingId !== box.id && (
                        <button onClick={() => { setEditingId(box.id); setEditPrice(box.finalPrice?.toString() || ''); }} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">Цена</button>
                      )}
                    </td>
                  </tr>
                  {/* Expanded timeline */}
                  {expandedId === box.id && (
                    <tr key={`${box.id}-detail`}>
                      <td colSpan={9} className="bg-slate-50/50 px-5 py-4">
                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* Info */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Детали</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-slate-400">Склад:</span> <span className="font-medium text-slate-700">{box.warehouse?.name || '—'}</span></div>
                              <div><span className="text-slate-400">Маршрут:</span> <span className="font-medium text-slate-700">{box.batch?.route || '—'}</span></div>
                              <div><span className="text-slate-400">Оплач. вес:</span> <span className="font-medium text-slate-700">{box.billableWeight ? `${Number(box.billableWeight).toFixed(1)} кг` : '—'}</span></div>
                              <div><span className="text-slate-400">Полка:</span> <span className="font-medium text-slate-700">{box.shelfLocation || '—'}</span></div>
                              {box.customerNote && <div className="col-span-2"><span className="text-slate-400">Заметка:</span> <span className="text-slate-700 italic">{box.customerNote}</span></div>}
                            </div>
                          </div>
                          {/* Timeline */}
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">История статусов</h3>
                            <div className="space-y-0">
                              {box.statusLog.map((log, i) => (
                                <div key={log.id} className="flex items-start gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full shrink-0 ${i === box.statusLog.length - 1 ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-slate-300'}`} />
                                    {i < box.statusLog.length - 1 && <div className="w-px h-6 bg-slate-200" />}
                                  </div>
                                  <div className="pb-3">
                                    <p className="text-sm font-medium text-slate-700">{STATUS_LABELS[log.status] || log.status}</p>
                                    <p className="text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    {log.comment && <p className="text-xs text-slate-500 italic mt-0.5">{log.comment}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">Стр. {page} из {totalPages} ({total} коробок)</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50">{t.common.prev}</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-40 hover:bg-slate-50">{t.common.forward}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
