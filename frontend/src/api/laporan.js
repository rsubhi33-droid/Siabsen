import api from './axios';

export const generateLaporan = (data) => api.post('/laporan/generate', data);
export const getLaporan = () => api.get('/laporan');

export const downloadLaporanFile = async (id, customFilename) => {
  const response = await api.get(`/laporan/download/${id}`, {
    responseType: 'blob',
  });

  // Ambil nama file dari Content-Disposition jika ada
  let filename = customFilename;
  const disposition = response.headers['content-disposition'];
  if (!filename && disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) filename = match[1];
  }
  if (!filename) filename = `laporan_${id}.xlsx`;

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadLaporan = (id) => `${api.defaults.baseURL}/laporan/download/${id}`;
