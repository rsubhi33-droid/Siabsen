import api from './axios';

export const getSesiByKegiatan = (kegiatanId) => api.get(`/kegiatan/${kegiatanId}/sesi`);
export const createSesi = (kegiatanId, data) => api.post(`/kegiatan/${kegiatanId}/sesi`, data);
export const generateQr = (sesiId) => api.post(`/sesi/${sesiId}/generate-qr`);
export const toggleSesi = (sesiId) => api.put(`/sesi/${sesiId}/toggle`);
export const deleteSesi = (sesiId) => api.delete(`/sesi/${sesiId}`);
