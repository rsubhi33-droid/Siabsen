const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created } = require('../utils/response');

/**
 * GET /api/master-data?tipe=kategori_kegiatan
 */
const getAll = async (req, res, next) => {
  try {
    const { tipe } = req.query;
    const where = {};
    if (tipe) where.tipe = tipe;

    const data = await db.MasterData.findAll({
      where,
      order: [['nama', 'ASC']],
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/master-data
 */
const create = async (req, res, next) => {
  try {
    const { kode } = req.body;

    if (kode) {
      const existing = await db.MasterData.findOne({ where: { kode } });
      if (existing) throw ApiError.conflict('Kode sudah digunakan.');
    }

    const masterData = await db.MasterData.create(req.body);
    return created(res, {
      message: 'Master data berhasil ditambahkan.',
      data: masterData,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/master-data/:id
 */
const update = async (req, res, next) => {
  try {
    const item = await db.MasterData.findByPk(req.params.id);
    if (!item) throw ApiError.notFound('Master data tidak ditemukan.');

    await item.update(req.body);
    return success(res, {
      message: 'Master data berhasil diperbarui.',
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/master-data/:id
 */
const remove = async (req, res, next) => {
  try {
    const item = await db.MasterData.findByPk(req.params.id);
    if (!item) throw ApiError.notFound('Master data tidak ditemukan.');

    await item.destroy();
    return success(res, { message: 'Master data berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
