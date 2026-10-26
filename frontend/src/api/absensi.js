import api from './axios';

export const scanQr = (data) => api.post('/absensi/scan', data);
export const manualCheckIn = (data) => api.post('/absensi/manual', data);
export const getAbsensiBySesi = (sesiId) => api.get(`/absensi/sesi/${sesiId}`);
export const getRiwayat = (params) => api.get('/absensi/riwayat', { params });
