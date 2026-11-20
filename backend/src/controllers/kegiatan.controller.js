const fs = require('fs');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created, paginated } = require('../utils/response');

/**
 * GET /api/kegiatan
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search, saya } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (search) {
      const { Op } = require('sequelize');
      where.nama = { [Op.like]: `%${search}%` };
    }

    // Filter "Kegiatan Saya":
    // 1. Panitia: kegiatan yang dibuat oleh panitia tersebut (created_by: req.user.id)
    // 2. Mahasiswa: kegiatan yang pernah diikuti/absen oleh mahasiswa tersebut
    if (saya === 'true' || saya === true) {
      if (req.user.role === 'panitia') {
        where.created_by = req.user.id;
      } else if (req.user.role === 'mahasiswa') {
        const { Op } = require('sequelize');
        // Cari kegiatan_id dari record absensi mahasiswa
        const absensiList = await db.Absensi.findAll({
          where: { user_id: req.user.id },
          attributes: ['kegiatan_id'],
          group: ['kegiatan_id'],
        });
        const kegiatanIds = absensiList.map((a) => a.kegiatan_id);
        where.id = { [Op.in]: kegiatanIds };
      }
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
    const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'panitia');
    const sesiAttributes = ['id', 'nama_sesi', 'tanggal', 'jam_mulai', 'jam_selesai', 'is_open'];
    if (isPrivileged) {
      sesiAttributes.push('qr_token');
    }

    const kegiatan = await db.Kegiatan.findByPk(req.params.id, {
      include: [
        { model: db.MasterData, as: 'kategori', attributes: ['id', 'nama'] },
        { model: db.User, as: 'pembuat', attributes: ['id', 'nama'] },
        {
          model: db.SesiKegiatan,
          as: 'sesi',
          attributes: sesiAttributes,
        },
      ],
    });

    if (!kegiatan) throw ApiError.notFound('Kegiatan tidak ditemukan.');

    // Jika panitia tapi bukan pemilik kegiatan (dan bukan admin), sensor qr_token
    const kegiatanJson = kegiatan.toJSON();
    if (req.user && req.user.role === 'panitia' && kegiatan.created_by !== req.user.id) {
      if (kegiatanJson.sesi) {
        kegiatanJson.sesi = kegiatanJson.sesi.map((s) => {
          const { qr_token, ...safeSesi } = s;
          return safeSesi;
        });
      }
    }

    return success(res, { data: kegiatanJson });
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

    // Validasi kepemilikan: Admin bisa edit semua, panitia hanya yang dibuatnya
    if (req.user.role === 'panitia' && kegiatan.created_by !== req.user.id) {
      throw ApiError.forbidden('Anda tidak memiliki izin mengedit kegiatan ini.');
    }

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

    // Validasi kepemilikan: Admin bisa hapus semua, panitia hanya yang dibuatnya
    if (req.user.role === 'panitia' && kegiatan.created_by !== req.user.id) {
      throw ApiError.forbidden('Anda tidak memiliki izin menghapus kegiatan ini.');
    }

    // Bersihkan file fisik laporan yang terkait sebelum record terhapus oleh cascade
    const laporanList = await db.Laporan.findAll({
      where: { kegiatan_id: kegiatan.id },
    });

    for (const lap of laporanList) {
      if (lap.filepath && fs.existsSync(lap.filepath)) {
        try {
          fs.unlinkSync(lap.filepath);
        } catch (unlinkErr) {
          console.warn(`Gagal menghapus file laporan fisik: ${lap.filepath}`, unlinkErr.message);
        }
      }
    }

    await kegiatan.destroy();
    return success(res, { message: 'Kegiatan berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
