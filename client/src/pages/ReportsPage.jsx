import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Coins,
  Percent,
  CheckCircle2,
  PieChart,
  BarChart3,
  Building2,
  ShieldCheck,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [annualSummary, setAnnualSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnnualData(selectedYear);
    fetchCategoryData();
  }, [selectedYear]);

  const fetchAnnualData = async (year) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/v1/reports/annual-summary?year=${year}`);
      setAnnualSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load annual summary');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryData = async () => {
    try {
      const res = await axios.get('/api/v1/reports/categories?type=expense');
      const items =
        res.data?.distribution?.items ||
        (Array.isArray(res.data?.distribution) ? res.data.distribution : []);
      setCategoryData(items);
    } catch (err) {
      console.error('Failed to load category distribution:', err);
      setCategoryData([]);
    }
  };

  const handleDownload = async (format) => {
    setIsExporting(true);
    try {
      let url = '';
      let filename = '';

      if (format === 'excel') {
        url = '/api/v1/reports/export/excel';
        filename = `smartspend-report-${selectedYear}.xlsx`;
      } else if (format === 'pdf') {
        url = '/api/v1/reports/export/pdf';
        filename = `smartspend-statement-${selectedYear}.pdf`;
      } else if (format === 'csv') {
        url = '/api/v1/imports/csv/export';
        filename = `smartspend-ledger-${selectedYear}.csv`;
      }

      const res = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Export failed. Please ensure you have recorded transactions and try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (minor) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(minor / 100);
  };

  // Prepare chart data
  const chartData = annualSummary?.months?.map((m) => ({
    name: m.monthName,
    Income: m.incomeMinor / 100,
    Expenses: m.expenseMinor / 100,
    Net: m.netCashFlowMinor / 100,
  })) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Financial Statements & Annual Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit-grade multi-sheet Excel workbooks, printable PDF statements, and 12-month analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
          >
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear + 1}>{currentYear + 1}</option>
          </select>

          {/* Export Excel */}
          <button
            onClick={() => handleDownload('excel')}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
            title="Download multi-sheet styled Excel workbook"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={() => handleDownload('pdf')}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
            title="Download printable PDF statement"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Statement</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={() => handleDownload('csv')}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Download sanitized CSV raw ledger"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {annualSummary?.annualTotals && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Annual Inflow (Income)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {formatCurrency(annualSummary.annualTotals.totalIncomeMinor)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Full year {selectedYear}</div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Annual Outflow (Expenses)</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {formatCurrency(annualSummary.annualTotals.totalExpenseMinor)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Full year {selectedYear}</div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Net Annual Savings</span>
              <Coins className="w-4 h-4 text-blue-500" />
            </div>
            <div
              className={`text-2xl font-bold mt-2 ${
                annualSummary.annualTotals.netCashFlowMinor >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(annualSummary.annualTotals.netCashFlowMinor)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Retained liquid capital</div>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <span>Annual Savings Rate</span>
              <Percent className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {annualSummary.annualTotals.savingsRate}%
            </div>
            <div className="text-xs text-slate-500 mt-1">Zero-division guard compliant</div>
          </div>
        </div>
      )}

      {/* 12-Month Performance Chart */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            12-Month Income vs. Expense Comparison ({selectedYear})
          </h3>
          <span className="text-xs text-slate-400 font-medium">Monthly Breakdown</span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Column Section: Monthly Breakdown Table & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Breakdown Table (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Month-by-Month Statement Summary
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Income</th>
                  <th className="py-2.5 px-3 text-right">Expenses</th>
                  <th className="py-2.5 px-3 text-right">Net Flow</th>
                  <th className="py-2.5 px-3 text-right">Savings %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {annualSummary?.months?.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {m.monthName} {selectedYear}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatCurrency(m.incomeMinor)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-500 font-medium">
                      {formatCurrency(m.expenseMinor)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        m.netCashFlowMinor >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(m.netCashFlowMinor)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                      {m.savingsRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Spending Breakdown (1 col) */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Category Expenses
            </h3>
            <span className="text-xs text-slate-400">All Time</span>
          </div>

          <div className="space-y-3 pt-2">
            {!Array.isArray(categoryData) || categoryData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No expense categories recorded yet.
              </p>
            ) : (
              categoryData.slice(0, 8).map((cat, idx) => (
                <div key={cat.categoryId || cat.name || idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {cat.categoryName || cat.name || 'Uncategorized'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(cat.totalMinor)} ({cat.percentage || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full"
                      style={{ width: `${cat.percentage || 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
