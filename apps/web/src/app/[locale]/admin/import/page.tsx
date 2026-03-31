'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useI18n } from '@/lib/i18n-context';

export default function BulkImportPage() {
  const { t, locale } = useI18n();
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  useEffect(() => {
    apiFetch<any[]>('/admin/warehouses').then((w) => {
      const list = w.map((x: any) => ({ id: x.id, name: x.name }));
      setWarehouses(list);
      if (list.length > 0) setWarehouseId(list[0].id);
    }).catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim() || !warehouseId) return;
    setImporting(true);
    setResult(null);
    try {
      const res = await apiFetch<{ imported: number; errors: string[] }>('/admin/import/parcels', {
        method: 'POST',
        body: JSON.stringify({ csv: csvText, warehouseId }),
      });
      setResult(res);
    } catch {
      setResult({ imported: 0, errors: ['Ошибка импорта'] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Массовый импорт посылок</h1>
        <p className="text-sm text-slate-500 mt-1">
          Загрузите CSV файл с колонками: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-600">tracking</code> (обязательно),{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-600">client_code</code>,{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-600">marketplace</code>,{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-600">weight</code>,{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-600">category</code>
        </p>
      </div>

      <div className="max-w-2xl space-y-5">
        {/* Warehouse select */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Склад</label>
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {/* File upload */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <label className="block text-sm font-medium text-slate-700 mb-3">CSV файл</label>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-5 file:py-2.5
                file:text-sm file:font-medium file:text-blue-700
                hover:file:bg-blue-100 file:cursor-pointer file:transition-colors"
            />
          </div>
        </div>

        {/* Preview */}
        {csvText && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Предпросмотр</label>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md font-medium">
                {csvText.split('\n').length - 1} строк
              </span>
            </div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none bg-slate-50/50"
            />
          </div>
        )}

        {/* Import button */}
        <button
          onClick={handleImport}
          disabled={importing || !csvText.trim() || !warehouseId}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {importing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Импорт...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Импортировать
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className={`rounded-xl border p-5 ${
            result.errors.length > 0
              ? 'bg-amber-50/50 border-amber-200'
              : 'bg-emerald-50/50 border-emerald-200'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {result.errors.length === 0 ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  Импортировано: <span className="text-emerald-700">{result.imported}</span>
                  {result.errors.length > 0 && (
                    <span className="text-amber-700 ml-3">Ошибок: {result.errors.length}</span>
                  )}
                </p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <ul className="mt-3 space-y-1 pl-11">
                {result.errors.slice(0, 20).map((err, i) => (
                  <li key={i} className="text-xs text-red-600">{err}</li>
                ))}
                {result.errors.length > 20 && (
                  <li className="text-xs text-slate-500">...и ещё {result.errors.length - 20} ошибок</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
