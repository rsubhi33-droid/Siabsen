import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject token ke setiap request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('siabsen_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (auto-logout) & 429 (rate-limit)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('siabsen_token');
      localStorage.removeItem('siabsen_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 429) {
      const message = error.response?.data?.message || 'Terlalu banyak permintaan. Silakan coba lagi sebentar.';
      // Jangan biarkan aplikasi crash; berikan pesan yang jelas
      console.warn('Rate limit exceeded:', message);
    }
    return Promise.reject(error);
  }
);

export default api;
