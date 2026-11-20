const { checkInManual, getAttendanceBySesi } = require('../../src/services/absensi.service');
const db = require('../../src/models');

describe('Absensi Service Unit Tests', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkInManual', () => {
    it('harus mencatat absensi manual beserta id panitia dan catatan audit', async () => {
      const mockSesi = { 
        id: 10, 
        kegiatan_id: 2, 
        is_open: true,
        tanggal: '2099-01-01',
        jam_selesai: '23:59:00',
        kegiatan: { id: 2, nama: 'Seminar AI', status: 'aktif' } 
      };
      const mockUser = { id: 5, nama: 'Mahasiswa Test', nim: '12345', is_active: true };

      jest.spyOn(db.SesiKegiatan, 'findByPk').mockResolvedValue(mockSesi);
      jest.spyOn(db.User, 'findByPk').mockResolvedValue(mockUser);
      jest.spyOn(db.Absensi, 'findOne').mockResolvedValue(null);

      let createdData = null;
      jest.spyOn(db.Absensi, 'create').mockImplementation(async (data) => {
        createdData = data;
        return { id: 1, ...data };
      });

      const res = await checkInManual(mockUser.id, mockSesi.id, 99, 'Input manual oleh panitia');

      expect(res.absensi).toBeDefined();
      expect(createdData).not.toBeNull();
      expect(createdData.verified_by).toBe(99);
      expect(createdData.catatan).toBe('Input manual oleh panitia');
      expect(createdData.metode).toBe('manual');
    });
  });

  describe('getAttendanceBySesi', () => {
    it('harus mengembalikan daftar absensi sesi beserta relasi verifikator', async () => {
      const mockList = [
        { id: 1, user_id: 5, status: 'hadir', verifikator: { id: 99, nama: 'Panitia' } },
      ];
      jest.spyOn(db.Absensi, 'findAll').mockResolvedValue(mockList);

      const res = await getAttendanceBySesi(10);
      expect(res).toEqual(mockList);
    });
  });
});
