import api from './axios';

export const getMasterData = (params) => api.get('/master-data', { params });
export const createMasterData = (data) => api.post('/master-data', data);
export const updateMasterData = (id, data) => api.put(`/master-data/${id}`, data);
export const deleteMasterData = (id) => api.delete(`/master-data/${id}`);

export const getUsers = (params) => api.get('/users', { params });
export const searchMahasiswaApi = (params) => api.get('/users/mahasiswa/search', { params });
export const getUserById = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const toggleUserActive = (id) => api.put(`/users/${id}/toggle-active`);

export const getDashboardStats = () => api.get('/dashboard/stats');
export const getKehadiranPerKegiatan = () => api.get('/dashboard/kehadiran-per-kegiatan');
export const getKehadiranPerProdi = () => api.get('/dashboard/kehadiran-per-prodi');
export const getRecentActivity = () => api.get('/dashboard/recent-activity');
