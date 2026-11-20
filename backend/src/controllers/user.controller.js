const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created, paginated } = require('../utils/response');

/**
 * GET /api/users
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Jika bukan admin (misal panitia), hanya boleh melihat user ber-role mahasiswa
    if (req.user.role === 'panitia') {
      where.role = 'mahasiswa';
    } else if (role) {
      where.role = role;
    }

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { nim: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    // Untuk panitia, kirim hanya field minimal yang relevan
    const attributes = req.user.role === 'panitia'
      ? ['id', 'nama', 'nim', 'prodi', 'angkatan', 'role']
      : { exclude: ['password'] };

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    return paginated(res, { data: rows, page, limit, totalItems: count });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/mahasiswa/search (Endpoint khusus pencarian mahasiswa untuk panitia/admin)
 */
const searchMahasiswa = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const { Op } = require('sequelize');

    const where = {
      role: 'mahasiswa',
      is_active: true,
    };

    if (search) {
      where[Op.or] = [
        { nama: { [Op.like]: `%${search}%` } },
        { nim: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.User.findAndCountAll({
      where,
      attributes: ['id', 'nama', 'nim', 'prodi', 'angkatan'],
      order: [['nama', 'ASC']],
      limit: parseInt(limit, 10),
      offset,
    });

    return paginated(res, { data: rows, page, limit, totalItems: count });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 */
const getById = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) throw ApiError.notFound('User tidak ditemukan.');
    return success(res, { data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users (admin create user)
 */
const create = async (req, res, next) => {
  try {
    const { email, nim } = req.body;

    const existingEmail = await db.User.findOne({ where: { email } });
    if (existingEmail) throw ApiError.conflict('Email sudah terdaftar.');

    if (nim) {
      const existingNim = await db.User.findOne({ where: { nim } });
      if (existingNim) throw ApiError.conflict('NIM sudah terdaftar.');
    }

    const user = await db.User.create(req.body);
    return created(res, {
      message: 'User berhasil dibuat.',
      data: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 */
const update = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) throw ApiError.notFound('User tidak ditemukan.');

    // Jangan update password dari sini
    const { password, ...updateData } = req.body;
    await user.update(updateData);

    return success(res, {
      message: 'User berhasil diperbarui.',
      data: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id/toggle-active
 */
const toggleActive = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id);
    if (!user) throw ApiError.notFound('User tidak ditemukan.');

    await user.update({ is_active: !user.is_active });

    return success(res, {
      message: `User ${user.is_active ? 'diaktifkan' : 'dinonaktifkan'}.`,
      data: user.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, toggleActive, searchMahasiswa };
