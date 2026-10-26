import api from './axios';

export const generateLaporan = (data) => api.post('/laporan/generate', data);
export const getLaporan = () => api.get('/laporan');
export const downloadLaporan = (id) => `${api.defaults.baseURL}/laporan/download/${id}`;
