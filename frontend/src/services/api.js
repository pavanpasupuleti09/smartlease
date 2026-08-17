import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT to every request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sl_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize backend error responses into a readable message.
// The backend returns { status, error, message, timestamp }.
function extractMessage(error) {
  const data = error?.response?.data;
  if (data && typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (error?.response?.status === 401) return 'Session expired. Please log in again.';
  if (error?.response?.status === 403) return 'Access denied.';
  if (error?.response?.status === 404) return 'Resource not found.';
  if (error?.code === 'ERR_NETWORK') return 'Cannot reach the server. Please try again.';
  return error?.message || 'Something went wrong. Please try again.';
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = extractMessage(error);

    // 401 from a protected endpoint: clear the stale session and send to login.
    if (status === 401) {
      localStorage.removeItem('sl_token');
      localStorage.removeItem('sl_profile');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const wrapped = new Error(message);
    wrapped.status = status;
    wrapped.original = error;
    return Promise.reject(wrapped);
  }
);

export default api;
