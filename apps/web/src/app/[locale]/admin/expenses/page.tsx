'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';

const scopeLabels: Record<string, string> = {
  BOX: 'Коробка',
  BATCH: 'Рейс',
  GENERAL: 'Общий',
};

const categoryLabels: Record<string, string> = {
  TRANSPORT: 'Транспортировка',
  CUSTOMS: 'Таможня',
  PACKAGING: 'Упаковка',
  LABOR: 'Работа',
  WAREHOUSE_RENT: 'Аренда склада',
  INSURANCE: 'Страховка',
  FUEL: 'Топливо',
  OTHER: 'Прочее',
};

const categoryOptions = Object.entries(categoryLabels);
const scopeOptions = Object.entries(scopeLabels);

interface Expense {
  id: string;
  date: string;
  category: string;
  scope: string;
  description: string;
  amount: number;
  currency: string;
  linkedBoxCode?: string;
  linkedBatchCode?: string;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [formScope, setFormScope] = useState('GENERAL');
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formDescription, setFormDescription] = useState('');
  const [formBoxCode, setFormBoxCode] = useState('');
  const [formBatchCode, setFormBatchCode] = useState('');
  const [formPeriodFrom, setFormPeriodFrom] = useState('');
  const [formPeriodTo, setFormPeriodTo] = useState('');

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<any>('/admin/expenses');
      setExpenses(Array.isArray(result) ? result : result.data || []);
    } catch {
      // error handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const resetForm = () => {
    setFormScope('GENERAL');
    setFormCategory('');
    setFormAmount('');
    setFormCurrency('USD');
    setFormDescription('');
    setFormBoxCode('');
    setFormBatchCode('');
    setFormPeriodFrom('');
    setFormPeriodTo('');
    setEditingId(null);
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormScope(expense.scope);
    setFormCategory(expense.category);
    setFormAmount(expense.amount.toString());
    setFormCurrency(expense.currency);
    setFormDescription(expense.description);
    setFormBoxCode(expense.linkedBoxCode || '');
    setFormBatchCode(expense.linkedBatchCode || '');
    setFormPeriodFrom('');
    setFormPeriodTo('');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formCategory || !formAmount) return;
    setSubmitLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        scope: formScope,
        category: formCategory,
        amount: parseFloat(formAmount),
        currency: formCurrency,
        description: formDescription,
      };
      if (formScope === 'BOX') body.boxCode = formBoxCode;
      if (formScope === 'BATCH') body.batchCode = formBatchCode;
      if (formScope === 'GENERAL') {
        if (formPeriodFrom) body.periodFrom = formPeriodFrom;
        if (formPeriodTo) body.periodTo = formPeriodTo;
      }

      if (editingId) {
        await apiFetch(`/admin/expenses/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/admin/expenses', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить расход?')) return;
    try {
      await apiFetch(`/admin/expenses/${id}`, { method: 'DELETE' });
      fetchExpenses();
    } catch {
      // error handled silently
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200/50">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </span>
            {t.nav.expenses}
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">Учет и управление расходами</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Добавить расход
        </button>
      </div>

      {/* Summary Card */}
      {!loading && expenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 border-t-[3px] border-t-red-500 p-5 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Всего расходов</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{expenses.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Общая сумма</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Дата</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Категория</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Область</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Описание</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Сумма</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Привязка</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/50">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                      <span className="text-sm text-slate-400">Загрузка...</span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-400">Расходы не найдены</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 text-sm">
                      {new Date(exp.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-slate-700">{categoryLabels[exp.category] || exp.category}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {scopeLabels[exp.scope] || exp.scope}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-sm text-slate-600">{exp.description}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 tabular-nums">
                      {exp.amount.toLocaleString()} {exp.currency}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                      {exp.linkedBoxCode || exp.linkedBatchCode || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(exp)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                        >
                          {t.common.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Редактировать расход' : 'Добавить расход'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Область</label>
                <select
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                >
                  {scopeOptions.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Категория</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                >
                  <option value="">Выберите категорию</option>
                  {categoryOptions.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Сумма</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Валюта</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="UZS">UZS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Описание</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Описание расхода"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors resize-none"
                />
              </div>

              {formScope === 'BOX' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Код коробки</label>
                  <input
                    type="text"
                    value={formBoxCode}
                    onChange={(e) => setFormBoxCode(e.target.value)}
                    placeholder="BOX-XXXX"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                  />
                </div>
              )}

              {formScope === 'BATCH' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Код рейса</label>
                  <input
                    type="text"
                    value={formBatchCode}
                    onChange={(e) => setFormBatchCode(e.target.value)}
                    placeholder="BATCH-XXXX"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                  />
                </div>
              )}

              {formScope === 'GENERAL' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Период с</label>
                    <input
                      type="date"
                      value={formPeriodFrom}
                      onChange={(e) => setFormPeriodFrom(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Период по</label>
                    <input
                      type="date"
                      value={formPeriodTo}
                      onChange={(e) => setFormPeriodTo(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading || !formCategory || !formAmount}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t.common.saving}
                  </span>
                ) : editingId ? t.common.save : t.common.add}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
