const jwt = require('jsonwebtoken');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created } = require('../utils/response');
const bridgeSsoService = require('../services/bridgeSso.service');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, nim } = req.body;

    // Cek duplikat email
    const existingEmail = await db.User.findOne({ where: { email } });
    if (existingEmail) {
      throw ApiError.conflict('Email sudah terdaftar.');
    }

    // Cek duplikat NIM
    if (nim) {
      const existingNim = await db.User.findOne({ where: { nim } });
      if (existingNim) {
        throw ApiError.conflict('NIM sudah terdaftar.');
      }
    }

    // Whitelist field secara eksplisit untuk mencegah mass assignment dan privilege escalation
    const { nama, email: userEmail, password, nim: userNim, prodi, angkatan, no_hp } = req.body;

    const user = await db.User.create({
      nama,
      email: userEmail,
      password,
      nim: userNim || null,
      prodi: prodi || null,
      angkatan: angkatan || null,
      no_hp: no_hp || null,
      role: 'mahasiswa',
      is_active: true,
    });
    const token = generateToken(user);

    return created(res, {
      message: 'Registrasi berhasil.',
      data: { user: user.toSafeJSON(), token },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Mendukung autentikasi hybrid:
 * 1. Format Email: Autentikasi lokal via database (Admin / Mitra Luar)
 * 2. Format Angka (NIM / NIP): Autentikasi Single Sign-On (SSO) Portal Kampus
 */
const login = async (req, res, next) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.username || req.body.email || '';
    const identifier = String(rawIdentifier).trim();
    const { password } = req.body;

    if (!identifier) {
      throw ApiError.badRequest('Email atau NIM/NIP wajib diisi.');
    }
    if (!password) {
      throw ApiError.badRequest('Password wajib diisi.');
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isDigitsOnly = /^\d+$/.test(identifier);

    // ─── ALUR 1: Autentikasi Lokal via Database (Admin / Mitra Luar) ───
    if (isEmail) {
      const user = await db.User.findOne({ where: { email: identifier } });
      if (!user) {
        throw ApiError.unauthorized('Email atau password salah.');
      }

      if (!user.is_active) {
        throw ApiError.forbidden('Akun Anda dinonaktifkan. Hubungi admin.');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw ApiError.unauthorized('Email atau password salah.');
      }

      const token = generateToken(user);

      return success(res, {
        message: 'Login berhasil.',
        data: {
          user: user.toSafeJSON(),
          token,
          auth_type: 'local',
        },
      });
    }

    // ─── ALUR 2: Autentikasi SSO Portal Kampus (NIM Mahasiswa / NIP Dosen) ───
    if (isDigitsOnly) {
      if (!bridgeSsoService.isEnabled()) {
        throw ApiError.badRequest('Autentikasi SSO Kampus sedang dinonaktifkan.');
      }

      // 1. Request Login ke Bridge API SSO Kampus
      const ssoLogin = await bridgeSsoService.login(identifier, password);
      if (!ssoLogin?.success || !ssoLogin?.token) {
        throw ApiError.unauthorized(ssoLogin?.message || 'NIM/NIP atau password SSO salah.');
      }

      // 2. Request Profil dari Bridge API SSO Kampus
      const ssoProfile = await bridgeSsoService.getProfile(ssoLogin.token, identifier);
      const profileData = ssoProfile?.data;

      if (!profileData) {
        throw ApiError.badRequest('Gagal memproses data profil dari portal kampus.');
      }

      // 3. Upsert User (Update or Create) berdasarkan NIM/NIP
      const user = await bridgeSsoService.upsertUserFromProfile(identifier, profileData);

      if (!user.is_active) {
        throw ApiError.forbidden('Akun Anda dinonaktifkan. Hubungi admin.');
      }

      // 4. Buat sesi login baru (terbitkan token JWT)
      const token = generateToken(user);

      return success(res, {
        message: ssoLogin.simulated
          ? 'Login SSO Kampus berhasil (Mode Simulasi).'
          : 'Login SSO Kampus berhasil.',
        data: {
          user: user.toSafeJSON(),
          token,
          auth_type: 'sso',
          sso: {
            identifier,
            simulated: !!ssoLogin.simulated,
            fallback: !!ssoLogin.fallback,
          },
        },
      });
    }

    // Format selain email dan angka
    throw ApiError.badRequest(
      'Format kredensial tidak valid. Gunakan Email untuk akun lokal atau NIM/NIP (angka) untuk akun kampus.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return success(res, {
      message: 'Data profil berhasil diambil.',
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) throw ApiError.notFound('User tidak ditemukan.');

    // Whitelist field yang boleh diupdate oleh user sendiri
    const { nama, no_hp, prodi } = req.body;
    const updateData = {};
    if (nama !== undefined) updateData.nama = nama;
    if (no_hp !== undefined) updateData.no_hp = no_hp;
    if (prodi !== undefined) updateData.prodi = prodi;

    await user.update(updateData);
    return success(res, {
      message: 'Profil berhasil diperbarui.',
      data: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile };
