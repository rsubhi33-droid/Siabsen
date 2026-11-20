const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const db = require('../../src/models');
const { scanLimiter, scanKeyGenerator } = require('../../src/middlewares/rateLimiter');

describe('FASE 4: Rate Limiting & Hardening Verification', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'secret';

  const userA = { id: 101, nama: 'User A', email: 'usera@test.com', role: 'mahasiswa', is_active: true };
  const userB = { id: 102, nama: 'User B', email: 'userb@test.com', role: 'mahasiswa', is_active: true };

  const tokenA = jwt.sign({ id: userA.id, email: userA.email, role: userA.role }, JWT_SECRET);
  const tokenB = jwt.sign({ id: userB.id, email: userB.email, role: userB.role }, JWT_SECRET);

  beforeEach(() => {
    jest.restoreAllMocks();

    jest.spyOn(db.User, 'findByPk').mockImplementation(async (id) => {
      if (id === userA.id) return { ...userA, toSafeJSON: () => userA };
      if (id === userB.id) return { ...userB, toSafeJSON: () => userB };
      return null;
    });
  });

  describe('Keyed Rate Limiting pada Scan Absensi (Banyak user dari 1 IP WiFi)', () => {
    it('memastikan keyGenerator scanLimiter membedakan user berdasarkan ID dari token', () => {
      const reqA = { user: { id: 101 }, ip: '192.168.1.50' };
      const reqB = { user: { id: 102 }, ip: '192.168.1.50' };

      // keyGenerator harus menghasilkan key berbeda meskipun IP sama
      const keyA = scanKeyGenerator(reqA);
      const keyB = scanKeyGenerator(reqB);

      expect(keyA).toBe('user_101');
      expect(keyB).toBe('user_102');
      expect(keyA).not.toBe(keyB);
    });

    it('fallback ke IP jika request tidak memiliki user login', () => {
      const reqAnon = { ip: '192.168.1.50' };
      const keyAnon = scanKeyGenerator(reqAnon);
      expect(keyAnon).toBe('192.168.1.50');
    });
  });

  describe('CORS and Security Headers', () => {
    it('harus menyertakan header proteksi keamanan Helmet', async () => {
      const res = await request(app).get('/health');
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options');
    });

    it('menolak origin yang tidak sah melalui CORS', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://malicious-website.com');

      // Middleware CORS akan memblokir origin tak terdaftar
      expect(res.status).toBe(500);
      expect(res.text || JSON.stringify(res.body)).toMatch(/tidak diizinkan oleh CORS/i);
    });
  });
});
