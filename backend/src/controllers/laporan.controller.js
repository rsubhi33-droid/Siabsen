const path = require('path');
const laporanService = require('../services/laporan.service');
const db = require('../models');
const ApiError = require('../utils/ApiError');
const { success, created } = require('../utils/response');

/**
 * POST /api/laporan/generate
 */
const generate = async (req, res, next) => {
  try {
    const { kegiatan_id, tipe } = req.body;

    if (!['excel', 'pdf'].includes(tipe)) {
      throw ApiError.badRequest('Tipe laporan harus "excel" atau "pdf".');
    }

    let laporan;
    if (tipe === 'excel') {
      laporan = await laporanService.generateExcel(kegiatan_id, req.user.id);
    } else {
      laporan = await laporanService.generatePdf(kegiatan_id, req.user.id);
    }

    return created(res, {
      message: `Laporan ${tipe.toUpperCase()} berhasil digenerate.`,
      data: laporan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/laporan/download/:id
 */
const download = async (req, res, next) => {
  try {
    const laporan = await db.Laporan.findByPk(req.params.id, {
      include: [{ model: db.Kegiatan, as: 'kegiatan' }],
    });
    if (!laporan) throw ApiError.notFound('Laporan tidak ditemukan.');

    // Cek hak akses:
    // Hanya Admin dan Dosen yang memiliki hak akses untuk mengunduh laporan kegiatan.
    const isAllowed = req.user.role === 'admin' || req.user.role === 'dosen';

    if (!isAllowed) {
      throw ApiError.forbidden('Anda tidak memiliki akses untuk mengunduh laporan kegiatan ini.');
    }

    // Validasi path traversal
    const safeFilePath = laporanService.validateReportPath(laporan.filepath);
    const fs = require('fs');
    if (!fs.existsSync(safeFilePath)) {
      throw ApiError.notFound('File laporan fisik tidak ditemukan pada server.');
    }

    return res.download(safeFilePath, laporan.filename);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/laporan
 */
const getAll = async (req, res, next) => {
  try {
    const data = await db.Laporan.findAll({
      include: [
        { model: db.Kegiatan, as: 'kegiatan', attributes: ['id', 'nama'] },
        { model: db.User, as: 'generator', attributes: ['id', 'nama'] },
      ],
      order: [['created_at', 'DESC']],
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = { generate, download, getAll };
