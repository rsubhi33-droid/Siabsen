const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created, paginated } = require('../utils/response');

/**
 * GET /api/kegiatan
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (search) {
      const { Op } = require('sequelize');
      where.nama = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await db.Kegiatan.findAndCountAll({
      where,
      include: [
        { model: db.MasterData, as: 'kategori', attributes: ['id', 'nama'] },
        { model: db.User, as: 'pembuat', attributes: ['id', 'nama'] },
      ],
      order: [['tanggal_mulai', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    return paginated(res, { data: rows, page, limit, totalItems: count });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/kegiatan/:id
 */
const getById = async (req, res, next) => {
  try {
    const kegiatan = await db.Kegiatan.findByPk(req.params.id, {
      include: [
        { model: db.MasterData, as: 'kategori', attributes: ['id', 'nama'] },
        { model: db.User, as: 'pembuat', attributes: ['id', 'nama'] },
        {
          model: db.SesiKegiatan,
          as: 'sesi',
          attributes: ['id', 'nama_sesi', 'tanggal', 'jam_mulai', 'jam_selesai', 'is_open', 'qr_token'],
        },
      ],
    });

    if (!kegiatan) throw ApiError.notFound('Kegiatan tidak ditemukan.');

    return success(res, { data: kegiatan });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/kegiatan
 */
const create = async (req, res, next) => {
  try {
    const kegiatan = await db.Kegiatan.create({
      ...req.body,
      created_by: req.user.id,
    });

    return created(res, {
      message: 'Kegiatan berhasil dibuat.',
      data: kegiatan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/kegiatan/:id
 */
const update = async (req, res, next) => {
  try {
    const kegiatan = await db.Kegiatan.findByPk(req.params.id);
    if (!kegiatan) throw ApiError.notFound('Kegiatan tidak ditemukan.');

    await kegiatan.update(req.body);
    return success(res, {
      message: 'Kegiatan berhasil diperbarui.',
      data: kegiatan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/kegiatan/:id
 */
const remove = async (req, res, next) => {
  try {
    const kegiatan = await db.Kegiatan.findByPk(req.params.id);
    if (!kegiatan) throw ApiError.notFound('Kegiatan tidak ditemukan.');

    await kegiatan.destroy();
    return success(res, { message: 'Kegiatan berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
