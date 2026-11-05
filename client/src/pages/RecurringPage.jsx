import React, { useState, useEffect } from 'react';
import { useRecurringStore } from '../store/recurringStore';
import { useAccountStore } from '../store/accountStore';
import { useCategoryStore } from '../store/categoryStore';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  History,
  CheckCircle2,
  ArrowRight,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Repeat,
  X,
  Building2,
  Tag,
  Zap,
} from 'lucide-react';

export default function RecurringPage() {
  const {
    rules,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    triggerSweep,
    fetchRuleTransactions,
    isLoading,
  } = useRecurringStore();

  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [historyRule, setHistoryRule] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sweepResult, setSweepResult] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState('expense');
  const [amountRupees, setAmountRupees] = useState('');
  const [accountId, setAccountId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRules();
    fetchAccounts();
    fetchCategories();
  }, [fetchRules, fetchAccounts, fetchCategories]);

  const openCreateModal = () => {
    setEditingRule(null);
    setTitle('');
    setType('expense');
    setAmountRupees('');
    setAccountId(accounts[0]?._id || '');
    setFromAccountId(accounts[0]?._id || '');
    setToAccountId(accounts[1]?._id || '');
    setCategoryId(categories.filter((c) => c.type === 'expense')[0]?._id || '');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setPaymentMethod('upi');
    setNotes('');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setTitle(rule.title);
    setType(rule.type);
    setAmountRupees((rule.amountMinor / 100).toString());
    setAccountId(rule.accountId?._id || rule.accountId || '');
    setFromAccountId(rule.fromAccountId?._id || rule.fromAccountId || '');
    setToAccountId(rule.toAccountId?._id || rule.toAccountId || '');
    setCategoryId(rule.categoryId?._id || rule.categoryId || '');
    setFrequency(rule.frequency);
    setStartDate(new Date(rule.startDate).toISOString().split('T')[0]);
    setEndDate(rule.endDate ? new Date(rule.endDate).toISOString().split('T')[0] : '');
    setPaymentMethod(rule.paymentMethod || 'upi');
    setNotes(rule.notes || '');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openHistoryModal = async (rule) => {
    setHistoryRule(rule);
    setHistoryLoading(true);
    try {
      const txs = await fetchRuleTransactions(rule._id);
      setHistoryTransactions(txs);
    } catch (err) {
      alert('Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      await updateRule(rule._id, { isActive: !rule.isActive });
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring rule?')) {
      try {
        await deleteRule(id);
      } catch (err) {
        alert(err.message || 'Failed to delete rule');
      }
    }
  };

  const handleRunSweep = async () => {
    try {
      const res = await triggerSweep();
      setSweepResult(res);
      setTimeout(() => setSweepResult(null), 5000);
    } catch (err) {
      alert(err.message || 'Sweep execution failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedRupees = parseFloat(amountRupees);
    if (isNaN(parsedRupees) || parsedRupees <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    const amountMinor = Math.round(parsedRupees * 100);

    try {
      if (editingRule) {
        await updateRule(editingRule._id, {
          title,
          amountMinor,
          frequency,
          endDate: endDate ? new Date(endDate).toISOString() : null,
          paymentMethod,
          notes,
        });
      } else {
        await createRule({
          title,
          type,
          amountMinor,
          accountId: type !== 'transfer' ? accountId : null,
          fromAccountId: type === 'transfer' ? fromAccountId : null,
          toAccountId: type === 'transfer' ? toAccountId : null,
          categoryId: type !== 'transfer' ? categoryId : null,
          frequency,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          paymentMethod,
          notes,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save recurring rule');
    }
  };

  const formatINR = (minor) => {
    return (
      '₹' +
      ((minor || 0) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Estimate monthly recurring totals
  const monthlyExpenseMinor = rules
    .filter((r) => r.isActive && r.type === 'expense')
    .reduce((sum, r) => {
      let multiplier = 1;
      if (r.frequency === 'daily') multiplier = 30;
      else if (r.frequency === 'weekly') multiplier = 4.33;
      else if (r.frequency === 'yearly') multiplier = 1 / 12;
      return sum + Math.round(r.amountMinor * multiplier);
    }, 0);

  const monthlyIncomeMinor = rules
    .filter((r) => r.isActive && r.type === 'income')
    .reduce((sum, r) => {
      let multiplier = 1;
      if (r.frequency === 'daily') multiplier = 30;
      else if (r.frequency === 'weekly') multiplier = 4.33;
      else if (r.frequency === 'yearly') multiplier = 1 / 12;
      return sum + Math.round(r.amountMinor * multiplier);
    }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Recurring Subscriptions & Rules
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Automated node-cron scheduler daemon with calendar edge-of-month guards (DEC-005)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunSweep}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
            title="Trigger Immediate Daemon Sweep"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Trigger Scheduler Sweep</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Recurring Rule</span>
          </button>
        </div>
      </div>

      {/* Sweep Toast Notification */}
      {sweepResult && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              Sweep Completed: <strong>{sweepResult.generatedCount}</strong> generated,{' '}
              <strong>{sweepResult.skippedCount}</strong> already up to date.
            </span>
          </div>
          <button onClick={() => setSweepResult(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Active Rules
          </span>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {rules.filter((r) => r.isActive).length}
          </p>
          <p className="text-xs text-slate-400 mt-1">out of {rules.length} configured rules</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Estimated Monthly Outflow
          </span>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {formatINR(monthlyExpenseMinor)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Rent, Subscriptions & Bills</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Estimated Monthly Inflow
          </span>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
            {formatINR(monthlyIncomeMinor)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Salary & Scheduled Returns</p>
        </div>
      </div>

      {/* Rules List / Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Scheduled Rules ({rules.length})</span>
        </h3>

        {rules.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Repeat className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No recurring rules set up yet
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Automate your monthly salary, rent, subscriptions (Netflix, Spotify), or mutual fund SIP transfers.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Recurring Rule</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const isIncome = rule.type === 'income';
              const isExpense = rule.type === 'expense';
              const isTransfer = rule.type === 'transfer';

              return (
                <div
                  key={rule._id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between space-y-4 transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
                    rule.isActive
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-slate-200/50 dark:border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isIncome
                              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                              : isExpense
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                          }`}
                        >
                          {rule.type}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                          {rule.frequency}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                        {rule.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          rule.isActive
                            ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={rule.isActive ? 'Pause Rule' : 'Activate Rule'}
                      >
                        {rule.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openHistoryModal(rule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Ledger History"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(rule)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Rule"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p
                      className={`text-2xl font-extrabold ${
                        isIncome
                          ? 'text-teal-600 dark:text-teal-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : '⇄'} {formatINR(rule.amountMinor)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>
                        {isTransfer
                          ? `${rule.fromAccountId?.name || 'Account A'} → ${rule.toAccountId?.name || 'Account B'}`
                          : rule.accountId?.name || 'Account'}
                      </span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Next: {new Date(rule.nextRunAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span>{rule.totalGeneratedCount} runs executed</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Recurring Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{editingRule ? 'Edit Recurring Rule' : 'New Recurring Transaction Rule'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingRule && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['expense', 'income', 'transfer'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold capitalize text-center transition-all ${
                          type === t
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rule Title / Description
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Netflix Monthly, Office Rent, House Salary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      placeholder="e.g. 1500.00"
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Recurrence Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none capitalize"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {type !== 'transfer' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Account
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name} ({acc.accountType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Uncategorized</option>
                      {categories
                        .filter((c) => c.type === type)
                        .map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      From Account (Debit)
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      To Account (Credit)
                    </label>
                    <select
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
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
                  {isLoading ? 'Saving...' : editingRule ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Execution History: {historyRule.title}</span>
              </h3>
              <button
                onClick={() => setHistoryRule(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {historyLoading ? (
              <p className="text-xs text-slate-400 py-8 text-center">Loading execution logs...</p>
            ) : historyTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No automated transactions recorded for this rule yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Description</th>
                      <th className="pb-2">Account</th>
                      <th className="pb-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {historyTransactions.map((tx) => (
                      <tr key={tx._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 text-slate-500 whitespace-nowrap">
                          {new Date(tx.transactionDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                          {tx.description}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {tx.accountId?.name || 'Linked Account'}
                        </td>
                        <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatINR(tx.amountMinor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
