import { create } from 'zustand';
import { api } from '../services/api';

export const useCategoryStore = create((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async (type = null, includeArchived = false) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (includeArchived) params.append('includeArchived', 'true');

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/categories${queryString}`);
      set({ categories: response.categories, isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/categories', data);
      set((state) => ({
        categories: [...state.categories, response.category],
        isLoading: false,
      }));
      return { success: true, category: response.category };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/categories/${id}`, data);
      set((state) => ({
        categories: state.categories.map((c) => (c._id === id ? response.category : c)),
        isLoading: false,
      }));
      return { success: true, category: response.category };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter((c) => c._id !== id),
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },
}));
