'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

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
      const data = await apiFetch<Expense[]>('/admin/expenses');
      setExpenses(data);
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
          method: 'PUT',
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Расходы</h1>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Добавить расход
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Дата</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Категория</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Область</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Описание</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Сумма</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Привязка</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Расходы не найдены
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(exp.date).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3">{categoryLabels[exp.category] || exp.category}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
                      {scopeLabels[exp.scope] || exp.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{exp.description}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {exp.amount.toLocaleString()} {exp.currency}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {exp.linkedBoxCode || exp.linkedBatchCode || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(exp)}
                        className="rounded border px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingId ? 'Редактировать расход' : 'Добавить расход'}
            </h2>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Область</label>
                <select
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {scopeOptions.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Категория</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите категорию</option>
                  {categoryOptions.map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Сумма</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Валюта</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="UZS">UZS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Описание</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Описание расхода"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {formScope === 'BOX' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Код коробки</label>
                  <input
                    type="text"
                    value={formBoxCode}
                    onChange={(e) => setFormBoxCode(e.target.value)}
                    placeholder="BOX-XXXX"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formScope === 'BATCH' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Код рейса</label>
                  <input
                    type="text"
                    value={formBatchCode}
                    onChange={(e) => setFormBatchCode(e.target.value)}
                    placeholder="BATCH-XXXX"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formScope === 'GENERAL' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Период с</label>
                    <input
                      type="date"
                      value={formPeriodFrom}
                      onChange={(e) => setFormPeriodFrom(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Период по</label>
                    <input
                      type="date"
                      value={formPeriodTo}
                      onChange={(e) => setFormPeriodTo(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
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
                disabled={submitLoading || !formCategory || !formAmount}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitLoading ? 'Сохранение...' : editingId ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
