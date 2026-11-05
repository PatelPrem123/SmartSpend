import { create } from 'zustand';
import { api } from '../services/api';

const now = new Date();
const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export const useBudgetStore = create((set, get) => ({
  budgets: [],
  selectedMonth: currentMonthYear,
  isLoading: false,
  error: null,

  setSelectedMonth: (monthYear) => {
    set({ selectedMonth: monthYear });
    get().fetchBudgets(monthYear);
  },

  fetchBudgets: async (monthYear) => {
    const targetMonth = monthYear || get().selectedMonth;
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/budgets?monthYear=${targetMonth}`);
      set({ budgets: response.budgets || [], isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch budgets', isLoading: false });
    }
  },

  createBudget: async (budgetData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/budgets', budgetData);
      set((state) => ({
        budgets: [...state.budgets, response.budget],
        isLoading: false,
      }));
      return response.budget;
    } catch (err) {
      set({ error: err.message || 'Failed to create budget', isLoading: false });
      throw err;
    }
  },

  updateBudget: async (id, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/budgets/${id}`, updateData);
      set((state) => ({
        budgets: state.budgets.map((b) => (b._id === id ? response.budget : b)),
        isLoading: false,
      }));
      return response.budget;
    } catch (err) {
      set({ error: err.message || 'Failed to update budget', isLoading: false });
      throw err;
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/budgets/${id}`);
      set((state) => ({
        budgets: state.budgets.filter((b) => b._id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err.message || 'Failed to delete budget', isLoading: false });
      throw err;
    }
  },
}));
