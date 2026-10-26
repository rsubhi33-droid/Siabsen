const db = require('../models');
const { success } = require('../utils/response');
const { Op, fn, col, literal } = require('sequelize');

/**
 * GET /api/dashboard/stats
 */
const getStats = async (req, res, next) => {
  try {
    const totalKegiatan = await db.Kegiatan.count();
    const kegiatanAktif = await db.Kegiatan.count({ where: { status: 'aktif' } });
    const totalMahasiswa = await db.User.count({ where: { role: 'mahasiswa' } });
    const totalAbsensi = await db.Absensi.count();

    return success(res, {
      data: {
        total_kegiatan: totalKegiatan,
        kegiatan_aktif: kegiatanAktif,
        total_mahasiswa: totalMahasiswa,
        total_absensi: totalAbsensi,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/kehadiran-per-kegiatan
 */
const getKehadiranPerKegiatan = async (req, res, next) => {
  try {
    const data = await db.Kegiatan.findAll({
      attributes: [
        'id',
        'nama',
        'tanggal_mulai',
        [fn('COUNT', col('absensi.id')), 'total_hadir'],
      ],
      include: [
        {
          model: db.Absensi,
          as: 'absensi',
          attributes: [],
        },
      ],
      group: ['Kegiatan.id'],
      order: [['tanggal_mulai', 'DESC']],
      limit: 10,
      subQuery: false,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/kehadiran-per-prodi
 */
const getKehadiranPerProdi = async (req, res, next) => {
  try {
    const data = await db.Absensi.findAll({
      attributes: [[fn('COUNT', col('Absensi.id')), 'total_hadir']],
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['prodi'],
        },
      ],
      group: ['user.prodi'],
      raw: true,
      nest: true,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/dashboard/recent-activity
 */
const getRecentActivity = async (req, res, next) => {
  try {
    const data = await db.Absensi.findAll({
      include: [
        { model: db.User, as: 'user', attributes: ['nama', 'nim', 'prodi'] },
        { model: db.Kegiatan, as: 'kegiatan', attributes: ['nama'] },
        { model: db.SesiKegiatan, as: 'sesi', attributes: ['nama_sesi'] },
      ],
      order: [['waktu_checkin', 'DESC']],
      limit: 20,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats, getKehadiranPerKegiatan, getKehadiranPerProdi, getRecentActivity };
