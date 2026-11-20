const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = require('../../src/app');
const db = require('../../src/models');
const { sanitizeFilename, validateReportPath, STORAGE_DIR } = require('../../src/services/laporan.service');

describe('FASE 3: Route Protection, Ownership & Path Traversal Security', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';

  const mhsUser = { id: 10, nama: 'Mhs Test', email: 'mhs@test.com', role: 'mahasiswa', is_active: true };
  const panitiaA = { id: 20, nama: 'Panitia A', email: 'panitiaA@test.com', role: 'panitia', is_active: true };
  const panitiaB = { id: 30, nama: 'Panitia B', email: 'panitiaB@test.com', role: 'panitia', is_active: true };
  const adminUser = { id: 40, nama: 'Admin User', email: 'admin@test.com', role: 'admin', is_active: true };

  const mhsToken = jwt.sign({ id: mhsUser.id, email: mhsUser.email, role: mhsUser.role }, JWT_SECRET);
  const panitiaAToken = jwt.sign({ id: panitiaA.id, email: panitiaA.email, role: panitiaA.role }, JWT_SECRET);
  const panitiaBToken = jwt.sign({ id: panitiaB.id, email: panitiaB.email, role: panitiaB.role }, JWT_SECRET);
  const adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, role: adminUser.role }, JWT_SECRET);

  beforeEach(() => {
    jest.restoreAllMocks();

    jest.spyOn(db.User, 'findByPk').mockImplementation(async (id) => {
      if (id === mhsUser.id) return { ...mhsUser, toSafeJSON: () => mhsUser };
      if (id === panitiaA.id) return { ...panitiaA, toSafeJSON: () => panitiaA };
      if (id === panitiaB.id) return { ...panitiaB, toSafeJSON: () => panitiaB };
      if (id === adminUser.id) return { ...adminUser, toSafeJSON: () => adminUser };
      return null;
    });
  });

  describe('Proteksi Role & Kepemilikan pada GET /api/absensi/sesi/:sesiId', () => {
    it('harus mengembalikan 403 Forbidden jika diakses oleh mahasiswa', async () => {
      const res = await request(app)
        .get('/api/absensi/sesi/100')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });

    it('harus mengembalikan 403 Forbidden jika panitia B mencoba mengakses absensi kegiatan milik panitia A', async () => {
      const mockSesi = {
        id: 100,
        kegiatan_id: 5,
        kegiatan: { id: 5, created_by: panitiaA.id }, // Dibuat oleh panitia A
      };
      jest.spyOn(db.SesiKegiatan, 'findByPk').mockResolvedValue(mockSesi);

      const res = await request(app)
        .get('/api/absensi/sesi/100')
        .set('Authorization', `Bearer ${panitiaBToken}`); // Diakses oleh panitia B

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/bukan panitia penyelenggara/i);
    });
  });

  describe('Proteksi & Sanitasi Download Laporan (GET /api/laporan/download/:id)', () => {
    it('harus mengembalikan 403 Forbidden jika mahasiswa mencoba download laporan', async () => {
      const res = await request(app)
        .get('/api/laporan/download/1')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(403);
    });

    it('harus mengembalikan 403 Forbidden jika panitia mencoba download laporan', async () => {
      const mockLaporan = {
        id: 1,
        kegiatan_id: 5,
        generated_by: adminUser.id,
        filepath: path.join(STORAGE_DIR, 'laporan_test.xlsx'),
        filename: 'laporan_test.xlsx',
        kegiatan: { id: 5, created_by: panitiaA.id },
      };
      jest.spyOn(db.Laporan, 'findByPk').mockResolvedValue(mockLaporan);

      const res = await request(app)
        .get('/api/laporan/download/1')
        .set('Authorization', `Bearer ${panitiaBToken}`);

      expect(res.status).toBe(403);
    });

    it('harus menolak path traversal jika record laporan mengarah ke luar direktori storage', async () => {
      const traversalPath = path.resolve(STORAGE_DIR, '../../src/server.js');
      const mockLaporanMalicious = {
        id: 99,
        kegiatan_id: 5,
        generated_by: adminUser.id,
        filepath: traversalPath,
        filename: 'server.js',
        kegiatan: { id: 5, created_by: adminUser.id },
      };
      jest.spyOn(db.Laporan, 'findByPk').mockResolvedValue(mockLaporanMalicious);

      const res = await request(app)
        .get('/api/laporan/download/99')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Akses path tidak diizinkan/i);
    });
  });

  describe('Verifikasi Penghapusan Public /storage Static Serving', () => {
    it('tidak boleh menyajikan file publik lewat /storage (harus 404)', async () => {
      const res = await request(app).get('/storage/any_report.xlsx');
      expect(res.status).toBe(404);
    });
  });

  describe('Unit Helper: Sanitasi Filename & Validasi Path', () => {
    it('harus membuang path traversal "../" dan karakter berbahaya dari nama kegiatan', () => {
      const maliciousName = '../../etc/passwd::*?"<>| seminar 2026';
      const clean = sanitizeFilename(maliciousName);
      expect(clean).not.toContain('..');
      expect(clean).not.toContain('/');
      expect(clean).not.toContain('\\');
      expect(clean).not.toContain(':');
    });

    it('validateReportPath harus melempar error saat path berada di luar direktori laporan', () => {
      expect(() => {
        validateReportPath(path.resolve(STORAGE_DIR, '../..', 'package.json'));
      }).toThrow();
    });
  });
});
