const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created } = require('../utils/response');
const { generateQrToken, generateQrImage } = require('../services/qr.service');

/**
 * POST /api/kegiatan/:kegiatanId/sesi
 */
const createSesi = async (req, res, next) => {
  try {
    const kegiatan = await db.Kegiatan.findByPk(req.params.kegiatanId);
    if (!kegiatan) throw ApiError.notFound('Kegiatan tidak ditemukan.');

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
    const sesiList = await db.SesiKegiatan.findAll({
      where: { kegiatan_id: req.params.kegiatanId },
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
    const sesi = await db.SesiKegiatan.findByPk(req.params.id);
    if (!sesi) throw ApiError.notFound('Sesi tidak ditemukan.');

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
    const sesi = await db.SesiKegiatan.findByPk(req.params.id);
    if (!sesi) throw ApiError.notFound('Sesi tidak ditemukan.');

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
    const sesi = await db.SesiKegiatan.findByPk(req.params.id);
    if (!sesi) throw ApiError.notFound('Sesi tidak ditemukan.');

    await sesi.destroy();
    return success(res, { message: 'Sesi berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSesi, getSesiByKegiatan, generateQr, toggleSesi, deleteSesi };
