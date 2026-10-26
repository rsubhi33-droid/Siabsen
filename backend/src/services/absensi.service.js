const db = require('../models');
const ApiError = require('../utils/ApiError');
const { verifyQrToken } = require('./qr.service');

/**
 * Proses absensi via QR scan.
 */
const checkInViaQr = async (userId, qrToken) => {
  // 1. Verifikasi token QR
  const verification = verifyQrToken(qrToken);
  if (!verification.valid) {
    throw ApiError.badRequest(verification.reason);
  }

  const { sesiId } = verification;

  // 2. Cari sesi kegiatan
  const sesi = await db.SesiKegiatan.findByPk(sesiId, {
    include: [{ model: db.Kegiatan, as: 'kegiatan' }],
  });

  if (!sesi) {
    throw ApiError.notFound('Sesi kegiatan tidak ditemukan.');
  }

  if (!sesi.is_open) {
    throw ApiError.badRequest('Sesi absensi belum dibuka atau sudah ditutup.');
  }

  if (sesi.kegiatan.status !== 'aktif') {
    throw ApiError.badRequest('Kegiatan ini tidak aktif.');
  }

  // 3. Cek apakah sudah pernah absen di sesi ini
  const existing = await db.Absensi.findOne({
    where: { user_id: userId, sesi_id: sesiId },
  });

  if (existing) {
    throw ApiError.conflict('Anda sudah tercatat hadir pada sesi ini.');
  }

  // 4. Tentukan status (hadir / terlambat)
  const now = new Date();
  const jamMulai = sesi.jam_mulai; // 'HH:mm:ss'
  const [h, m] = jamMulai.split(':').map(Number);
  const batasHadir = new Date(sesi.tanggal);
  batasHadir.setHours(h, m + 15, 0); // toleransi 15 menit

  const status = now > batasHadir ? 'terlambat' : 'hadir';

  // 5. Simpan absensi
  const absensi = await db.Absensi.create({
    user_id: userId,
    kegiatan_id: sesi.kegiatan_id,
    sesi_id: sesiId,
    metode: 'qr_scan',
    waktu_checkin: now,
    status,
  });

  return { absensi, sesi, status };
};

/**
 * Proses absensi manual oleh panitia.
 */
const checkInManual = async (userId, sesiId, verifiedBy, catatan = null) => {
  const sesi = await db.SesiKegiatan.findByPk(sesiId, {
    include: [{ model: db.Kegiatan, as: 'kegiatan' }],
  });

  if (!sesi) {
    throw ApiError.notFound('Sesi kegiatan tidak ditemukan.');
  }

  // Cek user ada
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound('User tidak ditemukan.');
  }

  // Cek duplikat
  const existing = await db.Absensi.findOne({
    where: { user_id: userId, sesi_id: sesiId },
  });

  if (existing) {
    throw ApiError.conflict('User sudah tercatat hadir pada sesi ini.');
  }

  const absensi = await db.Absensi.create({
    user_id: userId,
    kegiatan_id: sesi.kegiatan_id,
    sesi_id: sesiId,
    metode: 'manual',
    waktu_checkin: new Date(),
    status: 'hadir',
    catatan,
    verified_by: verifiedBy,
  });

  return { absensi, sesi };
};

/**
 * Ambil daftar hadir untuk sesi tertentu.
 */
const getAttendanceBySesi = async (sesiId) => {
  return db.Absensi.findAll({
    where: { sesi_id: sesiId },
    include: [
      { model: db.User, as: 'user', attributes: ['id', 'nama', 'nim', 'prodi', 'angkatan'] },
    ],
    order: [['waktu_checkin', 'ASC']],
  });
};

/**
 * Ambil riwayat kehadiran seorang user.
 */
const getUserAttendanceHistory = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await db.Absensi.findAndCountAll({
    where: { user_id: userId },
    include: [
      {
        model: db.Kegiatan,
        as: 'kegiatan',
        attributes: ['id', 'nama', 'tanggal_mulai', 'lokasi'],
      },
      {
        model: db.SesiKegiatan,
        as: 'sesi',
        attributes: ['id', 'nama_sesi', 'tanggal', 'jam_mulai', 'jam_selesai'],
      },
    ],
    order: [['waktu_checkin', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
  });

  return { data: rows, totalItems: count, page, limit };
};

module.exports = { checkInViaQr, checkInManual, getAttendanceBySesi, getUserAttendanceHistory };
