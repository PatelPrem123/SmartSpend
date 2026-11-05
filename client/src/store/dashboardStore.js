import { create } from 'zustand';
import { api } from '../services/api';

export const useDashboardStore = create((set, get) => ({
  summary: {
    totalIncomeMinor: 0,
    totalExpenseMinor: 0,
    netCashFlowMinor: 0,
    savingsRate: 0,
    totalAccountsBalanceMinor: 0,
    transactionCount: 0,
  },
  cashFlowSeries: [],
  categoryDistribution: {
    grandTotalMinor: 0,
    items: [],
  },
  isLoading: false,
  error: null,

  fetchSummary: async (startDate, endDate) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/dashboard/summary${queryStr}`);
      set({ summary: response.summary, isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to load dashboard summary', isLoading: false });
    }
  },

  fetchCashFlow: async (months = 6) => {
    try {
      const response = await api.get(`/reports/cashflow?months=${months}`);
      set({ cashFlowSeries: response.cashFlowSeries || [] });
    } catch (err) {
      set({ error: err.message || 'Failed to load cash flow series' });
    }
  },

  fetchCategoryDistribution: async (startDate, endDate, type = 'expense') => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('type', type);

      const response = await api.get(`/reports/categories?${params.toString()}`);
      set({ categoryDistribution: response.distribution || { grandTotalMinor: 0, items: [] } });
    } catch (err) {
      set({ error: err.message || 'Failed to load category distribution' });
    }
  },
}));
