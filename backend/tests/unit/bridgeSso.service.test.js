const { BridgeSSOService } = require('../../src/services/bridgeSso.service');

describe('BridgeSSOService Unit Tests', () => {
  let ssoService;

  beforeEach(() => {
    ssoService = new BridgeSSOService({
      enabled: true,
      baseUrl: 'https://bridge.uinssc.ac.id',
      timeout: 2,
      simulate: true,
    });
  });

  describe('Konfigurasi dan Status', () => {
    it('harus memuat konfigurasi default dan kustom dengan benar', () => {
      expect(ssoService.isEnabled()).toBe(true);
      expect(ssoService.isSimulated()).toBe(true);
      expect(ssoService.baseUrl).toBe('https://bridge.uinssc.ac.id');
      expect(ssoService.timeout).toBe(2);
    });

    it('harus menghapus trailing slash pada baseUrl', () => {
      const custom = new BridgeSSOService({
        baseUrl: 'https://bridge.uinssc.ac.id///',
      });
      expect(custom.baseUrl).toBe('https://bridge.uinssc.ac.id');
    });
  });

  describe('Simulasi Login dan Profil (simulateLogin & simulateProfile)', () => {
    it('harus menghasilkan token simulasi saat simulateLogin dipanggil untuk NIM mahasiswa', () => {
      const nim = '210101001';
      const result = ssoService.simulateLogin(nim, 'password123');

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(typeof result.token).toBe('string');
      expect(result.token).toContain('sim_token_');
    });

    it('harus menghasilkan profil mahasiswa yang valid saat simulateProfile dipanggil', () => {
      const nim = '210101001';
      const token = 'mock-token';
      const result = ssoService.simulateProfile(token, nim);

      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('unit_or_prodi', 'Teknik Informatika');
      expect(result.data).toHaveProperty('email', '210101001@uinssc.ac.id');
      expect(result.data).toHaveProperty('phone');
      expect(result.data).toHaveProperty('role', 'mahasiswa');
      expect(result.data).toHaveProperty('identifier', nim);
    });

    it('harus mengenali identitas dosen (NIP 18 digit) pada simulateProfile', () => {
      const nip = '198501012010011001';
      const result = ssoService.simulateProfile('mock-token', nip);

      expect(result.success).toBe(true);
      expect(result.data.role).toBe('dosen');
      expect(result.data.name).toContain('Dosen');
      expect(result.data.email).toContain('dosen.198501012010011001@uinssc.ac.id');
    });
  });

  describe('Alur Login dan GetProfile pada Mode Simulasi', () => {
    it('login() harus mengembalikan token simulasi tanpa request eksternal jika simulate=true', async () => {
      const result = await ssoService.login('210101001', 'password123');
      expect(result.success).toBe(true);
      expect(result.simulated).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('getProfile() harus memparsing atribut name, unit_or_prodi, email, phone, role', async () => {
      const result = await ssoService.getProfile('some-token', '210101001');
      expect(result.success).toBe(true);
      expect(result.data.name).toBeDefined();
      expect(result.data.unit_or_prodi).toBeDefined();
      expect(result.data.email).toBeDefined();
      expect(result.data.phone).toBeDefined();
      expect(result.data.role).toBe('mahasiswa');
    });
  });

  describe('Normalisasi Role (normalizeRole)', () => {
    it('harus menormalkan berbagai variasi role kampus dengan tepat', () => {
      expect(ssoService.normalizeRole('Dosen', '123')).toBe('dosen');
      expect(ssoService.normalizeRole('LECTURER', '123')).toBe('dosen');
      expect(ssoService.normalizeRole('Tenaga Pendidik / Pengajar', '123')).toBe('dosen');
      expect(ssoService.normalizeRole('Mahasiswa', '123')).toBe('mahasiswa');
      expect(ssoService.normalizeRole('Student', '123')).toBe('mahasiswa');
      expect(ssoService.normalizeRole('Admin', '123')).toBe('admin');
      expect(ssoService.normalizeRole('Panitia', '123')).toBe('panitia');
    });

    it('harus membedakan dosen vs mahasiswa dari panjang identifier jika role kosong', () => {
      expect(ssoService.normalizeRole(null, '198501012010011001')).toBe('dosen');
      expect(ssoService.normalizeRole(null, '210101001')).toBe('mahasiswa');
    });
  });

  describe('Ekstraksi Angkatan (extractAngkatan)', () => {
    it('harus mengekstrak tahun 4 digit dengan benar', () => {
      expect(ssoService.extractAngkatan('2024001001')).toBe(2024);
      expect(ssoService.extractAngkatan('2021123456')).toBe(2021);
    });

    it('harus mengekstrak tahun 2 digit dengan benar', () => {
      expect(ssoService.extractAngkatan('210101001')).toBe(2021);
      expect(ssoService.extractAngkatan('230101001')).toBe(2023);
    });

    it('harus mengembalikan null untuk identifier tidak valid', () => {
      expect(ssoService.extractAngkatan(null)).toBeNull();
      expect(ssoService.extractAngkatan('abc')).toBeNull();
    });
  });
});

