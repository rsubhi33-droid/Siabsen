import api from './axios';

export const getKegiatan = (params) => api.get('/kegiatan', { params });
export const getKegiatanById = (id) => api.get(`/kegiatan/${id}`);
export const createKegiatan = (data) => api.post('/kegiatan', data);
export const updateKegiatan = (id, data) => api.put(`/kegiatan/${id}`, data);
export const deleteKegiatan = (id) => api.delete(`/kegiatan/${id}`);
