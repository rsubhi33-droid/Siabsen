const jwt = require('jsonwebtoken');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created } = require('../utils/response');

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

    const user = await db.User.create(req.body);
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
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await db.User.findOne({ where: { email } });
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
      data: { user: user.toSafeJSON(), token },
    });
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

    await user.update(req.body);
    return success(res, {
      message: 'Profil berhasil diperbarui.',
      data: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile };
