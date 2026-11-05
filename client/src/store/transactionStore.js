import { create } from 'zustand';
import { api } from '../services/api';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  },
  filters: {
    type: '',
    accountId: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    search: '',
  },
  isLoading: false,
  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }, // Reset to page 1 on filter change
    }));
    get().fetchTransactions();
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchTransactions();
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    const { filters, pagination } = get();

    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      if (filters.type) params.append('type', filters.type);
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/transactions?${params.toString()}`);
      set({
        transactions: response.transactions,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  createTransaction: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/transactions', data);
      await get().fetchTransactions();
      return { success: true, transaction: response.transaction };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  createTransfer: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/transactions/transfer', data);
      await get().fetchTransactions();
      return { success: true, transaction: response.transaction };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  updateTransaction: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/transactions/${id}`, data);
      await get().fetchTransactions();
      return { success: true, transaction: response.transaction };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/transactions/${id}`);
      await get().fetchTransactions();
      return { success: true };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },
}));
