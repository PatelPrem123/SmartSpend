import { create } from 'zustand';
import { api } from '../services/api';

export const useImportStore = create((set, get) => ({
  batches: [],
  previewData: null,
  isLoading: false,
  isUploading: false,
  isCommitting: false,
  error: null,

  fetchBatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/imports');
      set({ batches: response.batches || [], isLoading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to fetch import history', isLoading: false });
    }
  },

  uploadAndPreview: async (file, accountId, mapping = null) => {
    set({ isUploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountId', accountId);
      if (mapping) {
        formData.append('mapping', JSON.stringify(mapping));
      }

      const response = await api.post('/imports/csv/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      set({ previewData: response, isUploading: false });
      return response;
    } catch (err) {
      set({ error: err.message || 'Failed to parse CSV file', isUploading: false });
      throw err;
    }
  },

  confirmImport: async (accountId, filename, rows, skipDuplicates = true) => {
    set({ isCommitting: true, error: null });
    try {
      const response = await api.post('/imports/csv/confirm', {
        accountId,
        filename,
        rows,
        skipDuplicates,
      });

      set({ previewData: null, isCommitting: false });
      get().fetchBatches();
      return response;
    } catch (err) {
      set({ error: err.message || 'Failed to commit transactions', isCommitting: false });
      throw err;
    }
  },

  clearPreview: () => {
    set({ previewData: null, error: null });
  },
}));
