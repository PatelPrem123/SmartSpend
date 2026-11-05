import React, { useState, useEffect } from 'react';
import { useGoalStore } from '../store/goalStore';
import { useAccountStore } from '../store/accountStore';
import {
  Target,
  Plus,
  Coins,
  Calendar,
  Sparkles,
  Trophy,
  History,
  Trash2,
  CheckCircle2,
  X,
  AlertCircle,
  Building2,
  ShieldCheck,
  TrendingUp,
  Percent,
  Clock,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES = [
  'Emergency Fund',
  'Retirement',
  'Home Purchase',
  'Vehicle',
  'Vacation',
  'Education',
  'Gadget',
  'Wedding',
  'Investment',
  'Other',
];

const COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#f97316', // orange
  '#14b8a6', // teal
];

export default function GoalsPage() {
  const {
    goals,
    selectedGoal,
    contributions,
    isLoading,
    error,
    fetchGoals,
    fetchGoalDetails,
    createGoal,
    updateGoal,
    deleteGoal,
    addContribution,
    deleteContribution,
    clearSelectedGoal,
  } = useGoalStore();

  const { accounts, fetchAccounts } = useAccountStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [activeGoalForContribute, setActiveGoalForContribute] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // Create Goal Form State
  const [formData, setFormData] = useState({
    name: '',
    targetAmountRupees: '',
    targetDate: '',
    category: 'Other',
    color: '#10b981',
    notes: '',
  });

  // Contribution Form State
  const [contribData, setContribData] = useState({
    amountRupees: '',
    accountId: '',
    notes: '',
  });

  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchGoals(statusFilter);
    fetchAccounts();
  }, [fetchGoals, fetchAccounts, statusFilter]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const targetPaise = Math.round(parseFloat(formData.targetAmountRupees) * 100);
    if (isNaN(targetPaise) || targetPaise < 100) {
      setSubmitError('Target amount must be at least ₹1.00');
      return;
    }

    if (!formData.targetDate) {
      setSubmitError('Please select a target completion date');
      return;
    }

    try {
      await createGoal({
        name: formData.name,
        targetAmountMinor: targetPaise,
        targetDate: formData.targetDate,
        category: formData.category,
        color: formData.color,
        notes: formData.notes,
      });

      setShowCreateModal(false);
      setFormData({
        name: '',
        targetAmountRupees: '',
        targetDate: '',
        category: 'Other',
        color: '#10b981',
        notes: '',
      });
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const amountPaise = Math.round(parseFloat(contribData.amountRupees) * 100);
    if (isNaN(amountPaise) || amountPaise < 100) {
      setSubmitError('Contribution amount must be at least ₹1.00');
      return;
    }

    try {
      await addContribution(activeGoalForContribute._id, {
        amountMinor: amountPaise,
        accountId: contribData.accountId || null,
        notes: contribData.notes,
      });

      setShowContributeModal(false);
      setContribData({ amountRupees: '', accountId: '', notes: '' });
      setActiveGoalForContribute(null);
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleOpenDetails = async (goal) => {
    await fetchGoalDetails(goal._id);
    setShowDetailsModal(true);
  };

  const formatCurrency = (minor) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(minor / 100);
  };

  // Aggregations
  const totalTargetMinor = goals.reduce((sum, g) => sum + g.targetAmountMinor, 0);
  const totalSavedMinor = goals.reduce((sum, g) => sum + g.currentAmountMinor, 0);
  const completedGoalsCount = goals.filter((g) => g.isReached || g.status === 'completed').length;
  const overallProgress =
    totalTargetMinor > 0 ? Math.min(100, Math.round((totalSavedMinor / totalTargetMinor) * 100)) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Savings Goals & Milestones
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ring-fence wealth, track milestone contributions, and achieve targets with integer paise precision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Saved Pool</span>
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalSavedMinor)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {goals.length} active savings goals
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Target Value</span>
            <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {formatCurrency(totalTargetMinor)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Remaining: {formatCurrency(Math.max(0, totalTargetMinor - totalSavedMinor))}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Overall Progress</span>
            <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            {overallProgress}%
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Completed Goals</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {completedGoalsCount} / {goals.length}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Milestones unlocked
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No savings goals found
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first savings goal to track your dream home, vehicle, emergency fund, or vacation with automated milestone alerts.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Set Up First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.currentAmountMinor / goal.targetAmountMinor) * 100)
            );
            const isCompleted = goal.isReached || goal.status === 'completed';
            const daysRemaining = Math.ceil(
              (new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={goal._id}
                className={`p-6 rounded-3xl border transition-all hover:shadow-lg ${
                  isCompleted
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: goal.color || '#10b981' }}
                    >
                      {isCompleted ? <Trophy className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {goal.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {goal.category}
                      </span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Reached!
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {goal.status}
                    </span>
                  )}
                </div>

                {/* Progress Dial / Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(goal.currentAmountMinor)}
                    </span>
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      of {formatCurrency(goal.targetAmountMinor)}
                    </span>
                  </div>

                  <div className="relative w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: goal.color || '#10b981',
                      }}
                    />
                  </div>

                  {/* Milestone Indicators */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pt-1">
                    <span className={pct >= 25 ? 'text-emerald-600 dark:text-emerald-400' : ''}>25%</span>
                    <span className={pct >= 50 ? 'text-emerald-600 dark:text-emerald-400' : ''}>50%</span>
                    <span className={pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : ''}>75%</span>
                    <span className={pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : ''}>100%</span>
                  </div>
                </div>

                {/* Target Date & Remaining */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {daysRemaining > 0
                        ? `${daysRemaining} days left`
                        : daysRemaining === 0
                        ? 'Target due today'
                        : `Past due by ${Math.abs(daysRemaining)}d`}
                    </span>
                  </div>
                  <div>
                    Remaining: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(Math.max(0, goal.targetAmountMinor - goal.currentAmountMinor))}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActiveGoalForContribute(goal);
                      setShowContributeModal(true);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Contribute
                  </button>

                  <button
                    onClick={() => handleOpenDetails(goal)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create Savings Goal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Create New Savings Goal
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dream House Downpayment, Emergency Fund"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 500000"
                    value={formData.targetAmountRupees}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmountRupees: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: col })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formData.color === col ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Additional context or strategy..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Contribution */}
      {showContributeModal && activeGoalForContribute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Contribute to: {activeGoalForContribute.name}
              </h3>
              <button
                onClick={() => setShowContributeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleContributeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contribution Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 5000"
                  value={contribData.amountRupees}
                  onChange={(e) =>
                    setContribData({ ...contribData, amountRupees: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-base font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Account (Optional)
                </label>
                <select
                  value={contribData.accountId}
                  onChange={(e) =>
                    setContribData({ ...contribData, accountId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">No Account (Manual / External Tracking)</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name} — {formatCurrency(acc.currentBalanceMinor)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  If selected, your account balance will automatically update and a ledger transaction will be logged.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contribution Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly salary savings slice"
                  value={contribData.notes}
                  onChange={(e) => setContribData({ ...contribData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-colors"
                >
                  Record Contribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Goal Details & Contribution Ledger */}
      {showDetailsModal && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedGoal.name} — Contribution History
                </h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Mini Status */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-medium">Saved</span>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {formatCurrency(selectedGoal.currentAmountMinor)} / {formatCurrency(selectedGoal.targetAmountMinor)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-medium">Status</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {selectedGoal.status}
                </p>
              </div>
            </div>

            {/* List of Contributions */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Contributions Log ({contributions.length})
              </h4>

              {contributions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No contributions recorded yet.
                </p>
              ) : (
                contributions.map((c) => (
                  <div
                    key={c._id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          +{formatCurrency(c.amountMinor)}
                        </span>
                        {c.accountId && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-emerald-500" />
                            {c.accountId.name || 'Account'}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {new Date(c.contributionDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        {c.notes ? `• ${c.notes}` : ''}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        if (
                          window.confirm(
                            'Are you sure you want to reverse this contribution? The amount will be refunded to your account balance.'
                          )
                        ) {
                          await deleteContribution(selectedGoal._id, c._id);
                        }
                      }}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Reverse contribution"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                onClick={async () => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete goal "${selectedGoal.name}"? All associated contributions will be removed.`
                    )
                  ) {
                    await deleteGoal(selectedGoal._id);
                    setShowDetailsModal(false);
                  }
                }}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Goal
              </button>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
