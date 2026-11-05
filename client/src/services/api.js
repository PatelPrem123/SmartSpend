import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message:
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected network error occurred',
      statusCode: error.response?.status || 500,
      details: error.response?.data?.details || null,
    };
    return Promise.reject(customError);
  }
);
