const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');

describe('FASE 1: Auth Security - Privilege Escalation Prevention', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('harus mengabaikan role dari body dan memaksa role mahasiswa saat registrasi', async () => {
      // Mock db.User.findOne agar tidak conflict
      jest.spyOn(db.User, 'findOne').mockResolvedValue(null);

      let createdData = null;
      jest.spyOn(db.User, 'create').mockImplementation(async (data) => {
        createdData = data;
        return {
          id: 999,
          nama: data.nama,
          email: data.email,
          role: data.role,
          is_active: data.is_active,
          toSafeJSON() {
            return {
              id: 999,
              nama: data.nama,
              email: data.email,
              role: data.role,
              is_active: data.is_active,
            };
          },
        };
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          nama: 'Attacker Admin',
          email: 'attacker@example.com',
          password: 'password123',
          role: 'admin',
          is_active: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verifikasi bahwa data yang diteruskan ke Model create memiliki role: 'mahasiswa' dan is_active: true
      expect(createdData).toBeDefined();
      expect(createdData.role).toBe('mahasiswa');
      expect(createdData.is_active).toBe(true);

      // Verifikasi response payload
      expect(res.body.data.user.role).toBe('mahasiswa');
      expect(res.body.data.user.is_active).toBe(true);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('tidak boleh mengizinkan mass assignment role atau is_active', async () => {
      const jwt = require('jsonwebtoken');
      const testUser = {
        id: 101,
        nama: 'Normal User',
        email: 'user@example.com',
        role: 'mahasiswa',
        is_active: true,
      };

      const token = jwt.sign(
        { id: testUser.id, email: testUser.email, role: testUser.role },
        process.env.JWT_SECRET || 'secret'
      );

      let updatedFields = null;
      const mockUserInstance = {
        ...testUser,
        update: jest.fn().mockImplementation(async (fields) => {
          updatedFields = fields;
          Object.assign(mockUserInstance, fields);
          return mockUserInstance;
        }),
        toSafeJSON: jest.fn().mockReturnValue({
          ...testUser,
          nama: 'New Name',
        }),
      };

      jest.spyOn(db.User, 'findByPk').mockResolvedValue(mockUserInstance);

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nama: 'New Name',
          role: 'admin',
          is_active: false,
        });

      expect(res.status).toBe(200);
      expect(mockUserInstance.update).toHaveBeenCalled();
      // Pastikan field update hanya berisi whitelist (nama, no_hp, prodi), tidak ada role atau is_active
      expect(updatedFields).toHaveProperty('nama', 'New Name');
      expect(updatedFields).not.toHaveProperty('role');
      expect(updatedFields).not.toHaveProperty('is_active');
    });
  });
});
