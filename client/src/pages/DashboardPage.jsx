import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import { useAccountStore } from '../store/accountStore';
import { useTransactionStore } from '../store/transactionStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Percent,
  Building2,
  ArrowLeftRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Tag,
  ChevronRight,
  PieChart as PieIcon,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    summary,
    cashFlowSeries,
    categoryDistribution,
    fetchSummary,
    fetchCashFlow,
    fetchCategoryDistribution,
    isLoading,
  } = useDashboardStore();

  const { accounts, fetchAccounts } = useAccountStore();
  const { transactions, fetchTransactions } = useTransactionStore();

  const [timeRange, setTimeRange] = useState('6'); // 3, 6, 12 months

  useEffect(() => {
    fetchSummary();
    fetchCashFlow(parseInt(timeRange, 10));
    fetchCategoryDistribution();
    fetchAccounts();
    fetchTransactions();
  }, [
    fetchSummary,
    fetchCashFlow,
    fetchCategoryDistribution,
    fetchAccounts,
    fetchTransactions,
    timeRange,
  ]);

  const formatINR = (minor) => {
    return (
      '₹' +
      ((minor || 0) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Prepare Cash Flow Chart Data
  const chartData = cashFlowSeries.map((item) => ({
    month: item.monthLabel,
    Income: item.incomeMinor / 100,
    Expenses: item.expenseMinor / 100,
    Net: item.netCashFlowMinor / 100,
  }));

  // Prepare Category Distribution Data
  const pieData = (categoryDistribution.items || []).map((item) => ({
    name: item.categoryName,
    value: item.totalMinor / 100,
    percentage: item.percentage,
    color: item.categoryColor || '#059669',
  }));

  const DEFAULT_COLORS = ['#059669', '#0284c7', '#d97706', '#dc2626', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Overview
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>. Here is your consolidated personal wealth status.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/transactions"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Income / Expense</span>
          </Link>
          <Link
            to="/transactions"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Transfer Funds</span>
          </Link>
          <Link
            to="/budgets"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700"
          >
            <PieIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Budgets</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Liquidity */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Liquidity
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatINR(summary.totalAccountsBalanceMinor)}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Across</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{accounts.length} active accounts</span>
          </p>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-teal-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Inflow
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
            {formatINR(summary.totalIncomeMinor)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Transfers excluded (DEC-003)</p>
        </div>

        {/* Total Expense */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {formatINR(summary.totalExpenseMinor)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Gross operational outflow</p>
        </div>

        {/* Net Cash Flow & Savings Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Net Cash Flow
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold mt-2 ${
              summary.netCashFlowMinor >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatINR(summary.netCashFlowMinor)}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-400">Savings Rate:</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {summary.savingsRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Area Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Monthly Cash Flow Velocity</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Income vs Expense time series trend
              </p>
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              {['3', '6', '12'].map((m) => (
                <button
                  key={m}
                  onClick={() => setTimeRange(m)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeRange === m
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No financial history available for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expenses"
                    stroke="#e11d48"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Spending Donut Chart (1 Col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Category Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Spending distribution by category
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-xs text-slate-400 text-center">
                No categorized expense data recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    ]}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Donut Legend */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {pieData.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
                  <span>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Accounts Summary & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts Liquidity Snapshot (1 Col) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Accounts Liquidity</span>
            </h3>
            <Link
              to="/accounts"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No accounts created yet.</p>
            ) : (
              accounts.slice(0, 4).map((acc) => (
                <div
                  key={acc._id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: acc.color || '#059669' }}
                    >
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</p>
                      <p className="text-[11px] text-slate-400 capitalize">{acc.accountType}</p>
                    </div>
                  </div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatINR(acc.currentBalanceMinor)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions Table Preview (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Recent Transactions</span>
            </h3>
            <Link
              to="/transactions"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No recent transactions recorded.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Description</th>
                    <th className="pb-2.5">Account</th>
                    <th className="pb-2.5">Category</th>
                    <th className="pb-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(t.transactionDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {t.description}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {t.accountId?.name ||
                          `${t.fromAccountId?.name || 'A'} → ${t.toAccountId?.name || 'B'}`}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {t.categoryId?.name || (t.type === 'transfer' ? 'Transfer' : 'General')}
                        </span>
                      </td>
                      <td
                        className={`py-3 text-right font-bold whitespace-nowrap ${
                          t.type === 'income'
                            ? 'text-teal-600 dark:text-teal-400'
                            : t.type === 'expense'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '⇄'}{' '}
                        {formatINR(t.amountMinor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
