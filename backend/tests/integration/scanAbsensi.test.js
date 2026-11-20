const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/models');
const { generateQrToken } = require('../../src/services/qr.service');

describe('FASE 2: QR Token Security & Scan Verification', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';

  const mahasiswaUser = {
    id: 1,
    nama: 'Mahasiswa Test',
    email: 'mhs@test.com',
    role: 'mahasiswa',
    is_active: true,
  };

  const panitiaUser = {
    id: 2,
    nama: 'Panitia Test',
    email: 'panitia@test.com',
    role: 'panitia',
    is_active: true,
  };

  const panitiaLainUser = {
    id: 3,
    nama: 'Panitia Lain',
    email: 'panitialain@test.com',
    role: 'panitia',
    is_active: true,
  };

  const mhsToken = jwt.sign(
    { id: mahasiswaUser.id, email: mahasiswaUser.email, role: mahasiswaUser.role },
    JWT_SECRET
  );

  const panitiaToken = jwt.sign(
    { id: panitiaUser.id, email: panitiaUser.email, role: panitiaUser.role },
    JWT_SECRET
  );

  const panitiaLainToken = jwt.sign(
    { id: panitiaLainUser.id, email: panitiaLainUser.email, role: panitiaLainUser.role },
    JWT_SECRET
  );

  beforeEach(() => {
    jest.restoreAllMocks();

    // Mock authenticate middleware DB lookup
    jest.spyOn(db.User, 'findByPk').mockImplementation(async (id) => {
      if (id === mahasiswaUser.id) return { ...mahasiswaUser, toSafeJSON: () => mahasiswaUser };
      if (id === panitiaUser.id) return { ...panitiaUser, toSafeJSON: () => panitiaUser };
      if (id === panitiaLainUser.id) return { ...panitiaLainUser, toSafeJSON: () => panitiaLainUser };
      return null;
    });
  });

  describe('Kebocoran qr_token pada GET /api/kegiatan/:id', () => {
    it('tidak boleh menyertakan qr_token pada respons kegiatan jika diakses oleh mahasiswa', async () => {
      const mockKegiatan = {
        id: 10,
        nama: 'Seminar Nasional AI',
        status: 'aktif',
        created_by: panitiaUser.id,
        sesi: [
          {
            id: 101,
            nama_sesi: 'Sesi 1',
            tanggal: '2026-10-30',
            jam_mulai: '08:00:00',
            jam_selesai: '10:00:00',
            is_open: true,
            // saat query mahasiswa, attributes exclude qr_token
          },
        ],
        toJSON() {
          return {
            id: this.id,
            nama: this.nama,
            status: this.status,
            created_by: this.created_by,
            sesi: [{ ...this.sesi[0] }],
          };
        },
      };

      jest.spyOn(db.Kegiatan, 'findByPk').mockResolvedValue(mockKegiatan);

      const res = await request(app)
        .get('/api/kegiatan/10')
        .set('Authorization', `Bearer ${mhsToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.sesi[0]).toBeDefined();
      expect(res.body.data.sesi[0].qr_token).toBeUndefined();
    });

    it('tidak boleh menyertakan qr_token jika diakses oleh panitia yang bukan pembuat kegiatan', async () => {
      const mockKegiatan = {
        id: 10,
        nama: 'Seminar Nasional AI',
        status: 'aktif',
        created_by: panitiaUser.id, // Dibuat oleh panitiaUser (id: 2)
        sesi: [
          {
            id: 101,
            nama_sesi: 'Sesi 1',
            is_open: true,
            qr_token: 'secret_active_qr_token',
          },
        ],
        toJSON() {
          return {
            id: this.id,
            nama: this.nama,
            created_by: this.created_by,
            sesi: [{ id: 101, nama_sesi: 'Sesi 1', is_open: true, qr_token: 'secret_active_qr_token' }],
          };
        },
      };

      jest.spyOn(db.Kegiatan, 'findByPk').mockResolvedValue(mockKegiatan);

      // Diakses oleh panitiaLainUser (id: 3)
      const res = await request(app)
        .get('/api/kegiatan/10')
        .set('Authorization', `Bearer ${panitiaLainToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.sesi[0].qr_token).toBeUndefined();
    });
  });

  describe('Verifikasi Scan QR Absensi (POST /api/absensi/scan)', () => {
    it('harus menolak QR token yang sudah dirotasi / tidak cocok dengan qr_token aktif di DB', async () => {
      const sesiId = 201;
      const validTokenOld = generateQrToken(sesiId);
      // Simulasikan token di DB telah dirotasi ke token lain
      const activeTokenInDb = `${sesiId}:${Date.now() + 5000}:fakesignature123`;

      const mockSesi = {
        id: sesiId,
        kegiatan_id: 10,
        nama_sesi: 'Sesi Utama',
        tanggal: '2099-10-30',
        jam_mulai: '08:00:00',
        jam_selesai: '23:59:00',
        is_open: true,
        qr_token: activeTokenInDb,
        kegiatan: { id: 10, status: 'aktif' },
      };

      jest.spyOn(db.SesiKegiatan, 'findByPk').mockResolvedValue(mockSesi);

      const res = await request(app)
        .post('/api/absensi/scan')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ qr_token: validTokenOld });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/QR code sudah tidak berlaku/i);
    });

    it('harus menolak jika sesi absensi belum dibuka atau sudah ditutup (is_open: false)', async () => {
      const sesiId = 202;
      const token = generateQrToken(sesiId);

      const mockSesi = {
        id: sesiId,
        kegiatan_id: 10,
        nama_sesi: 'Sesi Tutup',
        tanggal: '2026-10-30',
        jam_mulai: '08:00:00',
        is_open: false,
        qr_token: token,
        kegiatan: { id: 10, status: 'aktif' },
      };

      jest.spyOn(db.SesiKegiatan, 'findByPk').mockResolvedValue(mockSesi);

      const res = await request(app)
        .post('/api/absensi/scan')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ qr_token: token });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/belum dibuka atau sudah ditutup/i);
    });

    it('harus menolak duplikasi absensi (baik pre-check maupun race condition unique constraint)', async () => {
      const sesiId = 203;
      const token = generateQrToken(sesiId);

      const mockSesi = {
        id: sesiId,
        kegiatan_id: 10,
        nama_sesi: 'Sesi Terbuka',
        tanggal: '2099-10-30',
        jam_mulai: '08:00:00',
        jam_selesai: '23:59:00',
        is_open: true,
        qr_token: token,
        kegiatan: { id: 10, status: 'aktif' },
      };

      jest.spyOn(db.SesiKegiatan, 'findByPk').mockResolvedValue(mockSesi);
      // Simulasikan sudah ada absensi
      jest.spyOn(db.Absensi, 'findOne').mockResolvedValue({ id: 99 });

      const res = await request(app)
        .post('/api/absensi/scan')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ qr_token: token });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/sudah tercatat hadir/i);
    });

    it('harus menolak token dengan signature palsu', async () => {
      const res = await request(app)
        .post('/api/absensi/scan')
        .set('Authorization', `Bearer ${mhsToken}`)
        .send({ qr_token: '123:1700000000000:invalidsignature' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/tidak valid/i);
    });
  });
});
