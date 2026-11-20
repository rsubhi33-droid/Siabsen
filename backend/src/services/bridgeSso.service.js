const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const db = require('../models');
const crypto = require('crypto');

/**
 * Service terisolasi untuk integrasi Single Sign-On (SSO) Portal Kampus
 * (Bridge API eCampuz / Portal Akademik UIN SSC).
 */
class BridgeSSOService {
  constructor(customConfig = null) {
    const ssoConfig = customConfig || config.bridge_sso || {};
    this.enabled = ssoConfig.enabled ?? true;
    this.baseUrl = (ssoConfig.baseUrl || 'https://bridge.uinssc.ac.id').replace(/\/+$/, '');
    this.timeout = ssoConfig.timeout || 8; // Batas timeout dalam detik (default: 8)
    this.simulate = ssoConfig.simulate ?? false;
  }

  isEnabled() {
    return this.enabled;
  }

  isSimulated() {
    return this.simulate;
  }

  /**
   * Helper internal untuk melakukan HTTP request dengan timeout dan error handling standar.
   */
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const timeoutMs = this.timeout * 1000;

    const headers = {
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      let data = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
      }

      if (!response.ok) {
        const errorMessage = data?.message || data?.error || `Server SSO merespon status ${response.status}`;
        if (response.status === 401 || response.status === 422) {
          throw ApiError.unauthorized(errorMessage || 'Kredensial SSO kampus tidak valid.');
        } else if (response.status === 404) {
          // Khusus endpoint login portal kampus, respon 404 Not Found menandakan akun/NIM tidak terdaftar
          if (endpoint.includes('/login')) {
            throw ApiError.unauthorized('Kredensial SSO kampus tidak ditemukan (NIM / NIP tidak terdaftar di portal atau password salah).');
          }
          throw ApiError.notFound(`Endpoint SSO '${endpoint}' tidak ditemukan.`);
        } else if (response.status >= 500) {
          throw ApiError.badRequest(`Server SSO kampus sedang bermasalah (HTTP ${response.status}).`);
        }
        throw new ApiError(response.status, errorMessage);
      }

      return data;
    } catch (err) {
      clearTimeout(timer);

      // Tangani abort / timeout
      if (err.name === 'AbortError' || err.code === 'UND_ERR_ABORTED' || err.name === 'TimeoutError') {
        const timeoutError = new Error(`Koneksi ke Bridge SSO Kampus timeout (melebihi ${this.timeout} detik).`);
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      // Jika sudah berupa ApiError, teruskan
      if (err instanceof ApiError) {
        throw err;
      }

      // Tangani kesalahan jaringan (DNS tidak ditemukan, koneksi ditolak, host unreachable)
      const networkError = new Error(`Gagal menghubungi server SSO Kampus (${this.baseUrl}): ${err.message}`);
      networkError.isNetworkError = true;
      throw networkError;
    }
  }

  /**
   * 1. login(username, password)
   * Request POST ke {BASE_URL}/api/v2/portal/login
   * @param {string} username - NIM / NIP mahasiswa atau dosen
   * @param {string} password - Password portal kampus
   * @returns {Promise<{success: boolean, token: string, simulated?: boolean, fallback?: boolean, raw?: any}>}
   */
  async login(username, password) {
    if (this.simulate) {
      return this.simulateLogin(username, password);
    }

    try {
      const res = await this._request('/api/v2/portal/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const token = res?.data?.token || res?.token || res?.data?.access_token || res?.access_token;
      if (!token) {
        throw ApiError.unauthorized(res?.message || 'Token otentikasi tidak ditemukan dari respon SSO.');
      }

      return {
        success: true,
        token,
        raw: res,
      };
    } catch (err) {
      // Fallback mock data lokal ketika BRIDGE_SSO_SIMULATE=true atau saat koneksi timeout / server offline
      if ((err.isTimeout || err.isNetworkError) && (this.simulate || process.env.NODE_ENV !== 'production')) {
        console.warn(`⚠️ [BridgeSSOService] Koneksi SSO gagal (${err.message}). Mengaktifkan fallback mode simulasi.`);
        const sim = this.simulateLogin(username, password);
        sim.fallback = true;
        return sim;
      }

      if (err.isTimeout) {
        throw ApiError.badRequest('Koneksi ke server SSO Kampus melebihi batas waktu (timeout). Silakan coba lagi.');
      }
      if (err.isNetworkError) {
        throw ApiError.badRequest('Gagal terhubung ke server SSO Kampus. Pastikan server kampus online atau aktifkan mode simulasi.');
      }
      throw err;
    }
  }

  /**
   * 2. getProfile(token, username)
   * Request GET ke {BASE_URL}/api/v2/portal/profile dengan header Authorization: Bearer {token}
   * Parsing data profil: name, unit_or_prodi, email, phone, role.
   * @param {string} token - Bearer token hasil login SSO
   * @param {string} username - NIM / NIP mahasiswa atau dosen
   * @returns {Promise<{success: boolean, data: {name: string, unit_or_prodi: string, email: string, phone: string, role: string, identifier: string}, simulated?: boolean, raw?: any}>}
   */
  async getProfile(token, username) {
    if (this.simulate) {
      return this.simulateProfile(token, username);
    }

    try {
      let res;
      try {
        // Coba endpoint /api/v2/portal/profile
        res = await this._request('/api/v2/portal/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        // Jika 404, fallback ke endpoint /api/v2/profil (sesuai spesifikasi Postman)
        if (err.statusCode === 404) {
          res = await this._request('/api/v2/profil', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          throw err;
        }
      }

      const rawData = res?.data || res?.user || res || {};

      const profile = {
        name: rawData.nama || rawData.name || rawData.nama_lengkap || `Pengguna ${username}`,
        unit_or_prodi: rawData.unit_or_prodi || rawData.prodi || rawData.nama_prodi || rawData.jurusan || rawData.unit || null,
        email: rawData.email || `${username}@uinssc.ac.id`,
        phone: rawData.phone || rawData.no_hp || rawData.no_wa || rawData.telepon || rawData.handphone || null,
        role: this.normalizeRole(rawData.role, username),
        identifier: String(username),
      };

      return {
        success: true,
        data: profile,
        raw: res,
      };
    } catch (err) {
      // Fallback mock data lokal ketika BRIDGE_SSO_SIMULATE=true atau saat koneksi timeout / server offline
      if ((err.isTimeout || err.isNetworkError) && (this.simulate || process.env.NODE_ENV !== 'production')) {
        console.warn(`⚠️ [BridgeSSOService] Gagal mengambil profil SSO (${err.message}). Mengaktifkan fallback profil simulasi.`);
        const sim = this.simulateProfile(token, username);
        sim.fallback = true;
        return sim;
      }

      if (err.isTimeout) {
        throw ApiError.badRequest('Koneksi data profil SSO Kampus timeout.');
      }
      if (err.isNetworkError) {
        throw ApiError.badRequest('Gagal terhubung ke profil server SSO Kampus.');
      }
      throw err;
    }
  }

  /**
   * 3. simulateLogin(username, password)
   * Fallback mock data lokal ketika BRIDGE_SSO_SIMULATE=true atau koneksi timeout
   */
  simulateLogin(username, password) {
    const isDosen = String(username).length >= 15;
    return {
      success: true,
      token: `sim_token_${Buffer.from(String(username)).toString('base64')}_${Date.now()}`,
      simulated: true,
      message: `Login berhasil (Mode Simulasi SSO Kampus - ${isDosen ? 'Dosen' : 'Mahasiswa'})`,
    };
  }

  /**
   * 3. simulateProfile(token, username)
   * Fallback mock profil data lokal ketika BRIDGE_SSO_SIMULATE=true atau koneksi timeout
   */
  simulateProfile(token, username) {
    const cleanId = String(username).trim();
    const isDosen = cleanId.length >= 15;
    const role = isDosen ? 'dosen' : 'mahasiswa';
    const name = isDosen ? `Dr. Dosen SSO (${cleanId})` : `Mahasiswa SSO (${cleanId})`;
    const prodi = isDosen ? 'Sistem Informasi' : 'Teknik Informatika';
    const email = isDosen ? `dosen.${cleanId}@uinssc.ac.id` : `${cleanId}@uinssc.ac.id`;
    const phone = isDosen ? '081298765432' : '081234567890';

    return {
      success: true,
      simulated: true,
      data: {
        name,
        unit_or_prodi: prodi,
        email,
        phone,
        role,
        identifier: cleanId,
      },
      raw: {
        nama: name,
        prodi,
        email,
        no_hp: phone,
        role,
        nim: cleanId,
      },
    };
  }

  /**
   * Normalisasi role kampus ke ENUM yang didukung database SIABSEN:
   * ('mahasiswa', 'panitia', 'admin', 'dosen')
   */
  normalizeRole(role, identifier) {
    if (role) {
      const r = String(role).toLowerCase();
      if (r.includes('dosen') || r.includes('lecturer') || r.includes('pegawai') || r.includes('pengajar')) {
        return 'dosen';
      }
      if (r.includes('admin')) return 'admin';
      if (r.includes('panitia')) return 'panitia';
      if (r.includes('mahasiswa') || r.includes('student')) return 'mahasiswa';
    }
    // Default berdasarkan panjang digit identitas (NIP dosen standar 18 digit)
    return String(identifier).length >= 15 ? 'dosen' : 'mahasiswa';
  }

  /**
   * Ekstraksi tahun angkatan dari NIM mahasiswa
   */
  extractAngkatan(identifier) {
    if (!identifier) return null;
    const str = String(identifier).trim();
    // Contoh 4 digit: 2024001001 -> 2024
    if (str.length >= 4) {
      const yr4 = parseInt(str.substring(0, 4), 10);
      if (yr4 >= 2000 && yr4 <= 2099) return yr4;
    }
    // Contoh 2 digit: 210101001 -> 2021
    if (str.length >= 2) {
      const yr2 = parseInt(str.substring(0, 2), 10);
      if (yr2 >= 15 && yr2 <= 35) return 2000 + yr2;
    }
    return null;
  }

  /**
   * Upsert user di database lokal berdasarkan identitas NIM/NIP dari profil SSO kampus.
   * Simpan nama, email, prodi, dan no WA yang ditarik dari API kampus.
   */
  async upsertUserFromProfile(identifier, profile) {
    const cleanId = String(identifier).trim();
    const nama = profile.name || `User ${cleanId}`;
    const email = profile.email || `${cleanId}@uinssc.ac.id`;
    const prodi = profile.unit_or_prodi || null;
    const no_hp = profile.phone || null;
    const role = this.normalizeRole(profile.role, cleanId);
    const angkatan = role === 'mahasiswa' ? this.extractAngkatan(cleanId) : null;

    // 1. Cari berdasarkan NIM / NIP
    let user = await db.User.findOne({ where: { nim: cleanId } });

    if (user) {
      user.nama = nama;
      // Update email jika sebelumnya default atau kosong
      if (email && (!user.email || user.email.includes('@uinssc.ac.id'))) {
        user.email = email;
      }
      if (prodi) user.prodi = prodi;
      if (no_hp) user.no_hp = no_hp;
      if (angkatan && !user.angkatan) user.angkatan = angkatan;

      // Pertahankan hak akses jika user sudah diangkat jadi panitia/admin di SIABSEN
      if (user.role !== 'admin' && user.role !== 'panitia') {
        user.role = role;
      }

      await user.save();
      return user;
    }

    // 2. Cek apakah ada user berdasarkan email yang cocok
    const existingByEmail = await db.User.findOne({ where: { email } });
    if (existingByEmail) {
      existingByEmail.nim = cleanId;
      existingByEmail.nama = nama;
      if (prodi) existingByEmail.prodi = prodi;
      if (no_hp) existingByEmail.no_hp = no_hp;
      if (angkatan && !existingByEmail.angkatan) existingByEmail.angkatan = angkatan;

      if (existingByEmail.role !== 'admin' && existingByEmail.role !== 'panitia') {
        existingByEmail.role = role;
      }

      await existingByEmail.save();
      return existingByEmail;
    }

    // 3. User baru: buat akun baru dengan secure random password
    const randomPassword = crypto.randomBytes(24).toString('hex');
    user = await db.User.create({
      nama,
      email,
      password: randomPassword,
      nim: cleanId,
      prodi,
      angkatan,
      no_hp,
      role,
      is_active: true,
    });

    return user;
  }
}

const defaultInstance = new BridgeSSOService();
defaultInstance.BridgeSSOService = BridgeSSOService;

module.exports = defaultInstance;

