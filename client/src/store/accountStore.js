import { create } from 'zustand';
import { api } from '../services/api';

export const useAccountStore = create((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async (includeArchived = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/accounts${includeArchived ? '?includeArchived=true' : ''}`);
      set({ accounts: response.accounts, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  createAccount: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/accounts', data);
      set((state) => ({
        accounts: [response.account, ...state.accounts],
        isLoading: false,
      }));
      return { success: true, account: response.account };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  updateAccount: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/accounts/${id}`, data);
      set((state) => ({
        accounts: state.accounts.map((a) => (a._id === id ? response.account : a)),
        isLoading: false,
      }));
      return { success: true, account: response.account };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  archiveAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/accounts/${id}`);
      set((state) => ({
        accounts: state.accounts.filter((a) => a._id !== id),
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },
}));
