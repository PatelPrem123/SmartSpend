import React, { useState, useEffect } from 'react';
import { useBudgetStore } from '../store/budgetStore';
import { useCategoryStore } from '../store/categoryStore';
import {
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Tag,
  Sliders,
  X,
  Building2,
  TrendingUp,
} from 'lucide-react';

export default function BudgetsPage() {
  const {
    budgets,
    selectedMonth,
    setSelectedMonth,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    isLoading,
  } = useBudgetStore();

  const { categories, fetchCategories } = useCategoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalType, setModalType] = useState('category'); // 'category' | 'overall'
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchBudgets(selectedMonth);
    fetchCategories();
  }, [fetchBudgets, fetchCategories, selectedMonth]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 2, 1);
    const prev = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prev);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m, 1);
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(next);
  };

  const openCreateModal = () => {
    setEditingBudget(null);
    setModalType('category');
    setSelectedCategoryId(categories.filter((c) => c.type === 'expense')[0]?._id || '');
    setAmountRupees('');
    setNotes('');
    setSubmitError('');
    setIsModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setModalType(budget.isOverall ? 'overall' : 'category');
    setSelectedCategoryId(budget.category?._id || budget.categoryId || '');
    setAmountRupees((budget.amountLimitMinor / 100).toString());
    setNotes(budget.notes || '');
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const parsedRupees = parseFloat(amountRupees);
    if (isNaN(parsedRupees) || parsedRupees <= 0) {
      setSubmitError('Please enter a valid positive budget amount in rupees.');
      return;
    }

    const amountLimitMinor = Math.round(parsedRupees * 100);

    try {
      if (editingBudget) {
        await updateBudget(editingBudget._id, {
          amountLimitMinor,
          notes,
        });
      } else {
        await createBudget({
          monthYear: selectedMonth,
          isOverall: modalType === 'overall',
          categoryId: modalType === 'category' ? selectedCategoryId : null,
          amountLimitMinor,
          notes,
        });
      }
      setIsModalOpen(false);
      fetchBudgets(selectedMonth);
    } catch (err) {
      setSubmitError(err.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget limit?')) {
      try {
        await deleteBudget(id);
      } catch (err) {
        alert(err.message || 'Failed to delete budget');
      }
    }
  };

  const formatINR = (minor) => {
    return '₹' + ((minor || 0) / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getTierStyles = (tier) => {
    switch (tier) {
      case 'exceeded':
        return {
          bar: 'bg-rose-500',
          badge: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
          icon: AlertCircle,
          label: 'Exceeded',
        };
      case 'critical':
        return {
          bar: 'bg-amber-500',
          badge: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          icon: AlertTriangle,
          label: 'Critical (90%+)',
        };
      case 'warning':
        return {
          bar: 'bg-yellow-500',
          badge: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
          icon: AlertTriangle,
          label: 'Warning (75%+)',
        };
      default:
        return {
          bar: 'bg-emerald-500',
          badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle2,
          label: 'On Track',
        };
    }
  };

  const overallBudget = budgets.find((b) => b.isOverall);
  const categoryBudgets = budgets.filter((b) => !b.isOverall);

  const monthLabel = new Date(
    parseInt(selectedMonth.split('-')[0], 10),
    parseInt(selectedMonth.split('-')[1], 10) - 1,
    1
  ).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Budget Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Set proactive category spending limits with non-duplicate multi-tier alert engine (DEC-004)
          </p>
        </div>

        {/* Month Selector & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-slate-900 dark:text-white min-w-[120px] text-center">
              {monthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Budget</span>
          </button>
        </div>
      </div>

      {/* Overall Monthly Budget Banner (if configured) */}
      {overallBudget && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Overall Monthly Spending Cap
                </span>
                {(() => {
                  const style = getTierStyles(overallBudget.statusTier);
                  const Icon = style.icon;
                  return (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{style.label}</span>
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-baseline gap-3 mt-2">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {formatINR(overallBudget.spentMinor)}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  spent of {formatINR(overallBudget.amountLimitMinor)} limit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal(overallBudget)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Budget"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(overallBudget._id)}
                className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Budget"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  getTierStyles(overallBudget.statusTier).bar
                }`}
                style={{ width: `${Math.min(overallBudget.utilization, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{overallBudget.utilization}% Utilized</span>
              <span>Remaining: {formatINR(overallBudget.remainingMinor)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Category Budgets ({categoryBudgets.length})
          </h3>
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Sliders className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No category budgets set for {monthLabel}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create monthly spending caps for Groceries, Dining, Rent, or Shopping to stay in control.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Category Budget</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((budget) => {
              const style = getTierStyles(budget.statusTier);
              const TierIcon = style.icon;
              return (
                <div
                  key={budget._id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: budget.category?.color || '#059669' }}
                      >
                        <Tag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {budget.category?.name || 'Category'}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded-full text-[11px] font-semibold border ${style.badge}`}
                        >
                          <TierIcon className="w-3 h-3" />
                          <span>{style.label}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(budget)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Budget"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {formatINR(budget.spentMinor)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Cap: {formatINR(budget.amountLimitMinor)}
                      </p>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                        style={{ width: `${Math.min(budget.utilization, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{budget.utilization}% spent</span>
                      <span>Remaining: {formatINR(budget.remainingMinor)}</span>
                    </div>
                  </div>

                  {budget.notes && (
                    <p className="text-xs text-slate-400 italic border-t border-slate-100 dark:border-slate-800 pt-2">
                      "{budget.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{editingBudget ? 'Edit Budget' : 'Configure Spending Budget'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 font-medium">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingBudget && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Budget Scope
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalType('category')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        modalType === 'category'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Category Budget
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalType('overall')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        modalType === 'overall'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Overall Monthly Cap
                    </button>
                  </div>
                </div>
              )}

              {modalType === 'category' && !editingBudget && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Target Expense Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Monthly Limit Amount (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(e.target.value)}
                    placeholder="e.g. 5000.00"
                    required
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Stored as exact integer paise in backend ledger (DEC-002).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  maxLength={250}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Target savings goal for festive season"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {isLoading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
