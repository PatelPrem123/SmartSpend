import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartspend_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useGoalStore = create((set, get) => ({
  goals: [],
  selectedGoal: null,
  contributions: [],
  isLoading: false,
  error: null,

  fetchGoals: async (status = '') => {
    set({ isLoading: true, error: null });
    try {
      const url = status ? `/goals?status=${status}` : '/goals';
      const res = await api.get(url);
      set({ goals: res.data.data || [], isLoading: false });
    } catch (err) {
      set({
        error: err.response?.data?.error?.message || err.response?.data?.error || 'Failed to fetch goals',
        isLoading: false,
      });
    }
  },

  fetchGoalDetails: async (goalId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/goals/${goalId}`);
      set({
        selectedGoal: res.data.data.goal,
        contributions: res.data.data.contributions || [],
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.error?.message || err.response?.data?.error || 'Failed to fetch goal details',
        isLoading: false,
      });
    }
  },

  createGoal: async (goalData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/goals', goalData);
      set((state) => ({
        goals: [res.data.data, ...state.goals],
        isLoading: false,
      }));
      return res.data.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message || err.response?.data?.error || 'Failed to create goal';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  updateGoal: async (id, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch(`/goals/${id}`, updateData);
      set((state) => ({
        goals: state.goals.map((g) => (g._id === id ? res.data.data : g)),
        selectedGoal: state.selectedGoal?._id === id ? res.data.data : state.selectedGoal,
        isLoading: false,
      }));
      return res.data.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message || err.response?.data?.error || 'Failed to update goal';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  deleteGoal: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/goals/${id}`);
      set((state) => ({
        goals: state.goals.filter((g) => g._id !== id),
        selectedGoal: state.selectedGoal?._id === id ? null : state.selectedGoal,
        isLoading: false,
      }));
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message || err.response?.data?.error || 'Failed to delete goal';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  addContribution: async (goalId, contributionData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post(`/goals/${goalId}/contributions`, contributionData);
      const { contribution, goal } = res.data.data;

      set((state) => ({
        goals: state.goals.map((g) => (g._id === goalId ? goal : g)),
        selectedGoal: state.selectedGoal?._id === goalId ? goal : state.selectedGoal,
        contributions: [contribution, ...state.contributions],
        isLoading: false,
      }));
      return res.data.data;
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message || err.response?.data?.error || 'Failed to record contribution';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  deleteContribution: async (goalId, contributionId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.delete(`/goals/${goalId}/contributions/${contributionId}`);
      const updatedGoal = res.data.data;

      set((state) => ({
        goals: state.goals.map((g) => (g._id === goalId ? updatedGoal : g)),
        selectedGoal: state.selectedGoal?._id === goalId ? updatedGoal : state.selectedGoal,
        contributions: state.contributions.filter((c) => c._id !== contributionId),
        isLoading: false,
      }));
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message || err.response?.data?.error || 'Failed to reverse contribution';
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  clearSelectedGoal: () => set({ selectedGoal: null, contributions: [] }),
}));
