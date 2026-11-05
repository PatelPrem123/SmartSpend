import { create } from 'zustand';
import { api } from '../services/api';

export const useRecurringStore = create((set, get) => ({
  rules: [],
  isLoading: false,
  error: null,

  fetchRules: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/recurring');
      set({ rules: response.rules || [], isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch recurring rules', isLoading: false });
    }
  },

  createRule: async (ruleData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/recurring', ruleData);
      set((state) => ({
        rules: [...state.rules, response.rule],
        isLoading: false,
      }));
      return response.rule;
    } catch (err) {
      set({ error: err.message || 'Failed to create recurring rule', isLoading: false });
      throw err;
    }
  },

  updateRule: async (id, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/recurring/${id}`, updateData);
      set((state) => ({
        rules: state.rules.map((r) => (r._id === id ? response.rule : r)),
        isLoading: false,
      }));
      return response.rule;
    } catch (err) {
      set({ error: err.message || 'Failed to update recurring rule', isLoading: false });
      throw err;
    }
  },

  deleteRule: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/recurring/${id}`);
      set((state) => ({
        rules: state.rules.filter((r) => r._id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err.message || 'Failed to delete recurring rule', isLoading: false });
      throw err;
    }
  },

  triggerSweep: async () => {
    try {
      const response = await api.post('/recurring/sweep');
      get().fetchRules();
      return response.result;
    } catch (err) {
      set({ error: err.message || 'Failed to trigger scheduler sweep' });
      throw err;
    }
  },

  fetchRuleTransactions: async (id) => {
    try {
      const response = await api.get(`/recurring/${id}/transactions`);
      return response.transactions || [];
    } catch (err) {
      throw err;
    }
  },
}));
