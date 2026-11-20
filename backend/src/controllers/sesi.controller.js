const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created } = require('../utils/response');
const { generateQrToken, generateQrImage } = require('../services/qr.service');

const checkSesiPermission = (kegiatan, user) => {
  if (!kegiatan) throw ApiError.notFound('Kegiatan tidak ditemukan.');
  if (user.role === 'admin') return true;
  if (user.role === 'panitia' && kegiatan.created_by === user.id) return true;
  throw ApiError.forbidden('Anda tidak memiliki izin mengelola sesi pada kegiatan ini.');
};

/**
 * POST /api/kegiatan/:kegiatanId/sesi
 */
const createSesi = async (req, res, next) => {
  try {
    const kegiatan = await db.Kegiatan.findByPk(req.params.kegiatanId);
    checkSesiPermission(kegiatan, req.user);

    const sesi = await db.SesiKegiatan.create({
      ...req.body,
      kegiatan_id: kegiatan.id,
    });

    return created(res, {
      message: 'Sesi kegiatan berhasil dibuat.',
      data: sesi,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/kegiatan/:kegiatanId/sesi
 */
const getSesiByKegiatan = async (req, res, next) => {
  try {
    const kegiatan = await db.Kegiatan.findByPk(req.params.kegiatanId);
    if (!kegiatan) throw ApiError.notFound('Kegiatan tidak ditemukan.');

    const isPrivileged = req.user && (
      req.user.role === 'admin' ||
      (req.user.role === 'panitia' && kegiatan.created_by === req.user.id)
    );

    const attributes = isPrivileged
      ? undefined
      : { exclude: ['qr_token'] };

    const sesiList = await db.SesiKegiatan.findAll({
      where: { kegiatan_id: req.params.kegiatanId },
      attributes,
      order: [['tanggal', 'ASC'], ['jam_mulai', 'ASC']],
    });

    return success(res, { data: sesiList });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sesi/:id/generate-qr
 */
const generateQr = async (req, res, next) => {
  try {
    const sesi = await db.SesiKegiatan.findByPk(req.params.id, {
      include: [{ model: db.Kegiatan, as: 'kegiatan' }],
    });
    if (!sesi) throw ApiError.notFound('Sesi tidak ditemukan.');
    checkSesiPermission(sesi.kegiatan, req.user);

    // Cek apakah waktu sesi sudah lewat
    const now = new Date();
    const [endH = 23, endM = 59] = (sesi.jam_selesai || '23:59:00').split(':').map(Number);
    const endDateTime = new Date(sesi.tanggal);
    endDateTime.setHours(endH, endM, 0, 0);

    if (now > endDateTime) {
      await sesi.update({ is_open: false });
      throw ApiError.badRequest('Tidak dapat generate QR untuk sesi yang sudah berakhir/selesai.');
    }

    const qrToken = generateQrToken(sesi.id);
    const qrImage = await generateQrImage(qrToken);

    await sesi.update({
      qr_token: qrToken,
      qr_generated_at: new Date(),
      is_open: true,
    });

    return success(res, {
      message: 'QR Code berhasil di-generate.',
      data: { qr_token: qrToken, qr_image: qrImage, sesi },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/sesi/:id/toggle
 */
const toggleSesi = async (req, res, next) => {
  try {
    const sesi = await db.SesiKegiatan.findByPk(req.params.id, {
      include: [{ model: db.Kegiatan, as: 'kegiatan' }],
    });
    if (!sesi) throw ApiError.notFound('Sesi tidak ditemukan.');
    checkSesiPermission(sesi.kegiatan, req.user);

    // Jika ingin membuka sesi (is_open menjadi true), pastikan sesi belum lewat jam selesai
    if (!sesi.is_open) {
      const now = new Date();
      const [endH = 23, endM = 59] = (sesi.jam_selesai || '23:59:00').split(':').map(Number);
      const endDateTime = new Date(sesi.tanggal);
      endDateTime.setHours(endH, endM, 0, 0);

      if (now > endDateTime) {
        throw ApiError.badRequest('Tidak dapat membuka sesi yang sudah berakhir/selesai.');
      }
    }

    await sesi.update({ is_open: !sesi.is_open });

    return success(res, {
      message: `Sesi ${sesi.is_open ? 'dibuka' : 'ditutup'}.`,
      data: sesi,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/sesi/:id
 */
const deleteSesi = async (req, res, next) => {
  try {
    const sesi = await db.SesiKegiatan.findByPk(req.params.id, {
      include: [{ model: db.Kegiatan, as: 'kegiatan' }],
    });
    if (!sesi) throw ApiError.notFound('Sesi tidak ditemukan.');
    checkSesiPermission(sesi.kegiatan, req.user);

    await sesi.destroy();
    return success(res, { message: 'Sesi berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSesi, getSesiByKegiatan, generateQr, toggleSesi, deleteSesi };
