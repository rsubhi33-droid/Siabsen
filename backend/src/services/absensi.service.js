const db = require('../models');
const ApiError = require('../utils/ApiError');
const { verifyQrToken } = require('./qr.service');

/**
 * Proses absensi via QR scan.
 */
const checkInViaQr = async (userId, qrToken) => {
  // 1. Verifikasi signature dan format token QR
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

  // Validasi apakah waktu sesi sudah lewat / selesai
  const nowCheck = new Date();
  const [endH = 23, endM = 59] = (sesi.jam_selesai || '23:59:00').split(':').map(Number);
  const endDateTime = new Date(sesi.tanggal);
  endDateTime.setHours(endH, endM, 0, 0);

  if (nowCheck > endDateTime) {
    // Otomatis update is_open = false jika terbukti sudah lewat jam selesai
    await sesi.update({ is_open: false });
    throw ApiError.badRequest('Sesi absensi telah berakhir/selesai. Tidak dapat melakukan presensi.');
  }

  // Bandingkan token yang dikirim dengan token aktif di DB (token lama/rotasi ditolak)
  if (!sesi.qr_token || sesi.qr_token !== qrToken) {
    throw ApiError.badRequest('QR code sudah tidak berlaku (telah dirotasi atau ditutup). Silakan scan QR terbaru.');
  }

  if (sesi.kegiatan.status !== 'aktif') {
    throw ApiError.badRequest('Kegiatan ini tidak aktif.');
  }

  // Verifikasi mahasiswa/user aktif
  const user = await db.User.findByPk(userId);
  if (!user || !user.is_active) {
    throw ApiError.forbidden('Akun Anda tidak aktif atau tidak ditemukan.');
  }

  // 3. Cek apakah sudah pernah absen di sesi ini (pre-check)
  const existing = await db.Absensi.findOne({
    where: { user_id: userId, sesi_id: sesiId },
  });

  if (existing) {
    throw ApiError.conflict('Anda sudah tercatat hadir pada sesi ini.');
  }

  // 4. Validasi kuota kegiatan & simpan absensi dengan database transaction
  const result = await db.sequelize.transaction(async (t) => {
    if (sesi.kegiatan.kuota && sesi.kegiatan.kuota > 0) {
      // Hitung total peserta unik yang hadir pada kegiatan ini
      const totalPeserta = await db.Absensi.count({
        where: { kegiatan_id: sesi.kegiatan_id },
        distinct: true,
        col: 'user_id',
        transaction: t,
        lock: t.LOCK ? t.LOCK.UPDATE : undefined,
      });

      if (totalPeserta >= sesi.kegiatan.kuota) {
        // Cek apakah user ini sudah pernah terhitung di sesi kegiatan lain sebelumnya
        const sudahIkutSesiLain = await db.Absensi.findOne({
          where: { user_id: userId, kegiatan_id: sesi.kegiatan_id },
          transaction: t,
        });
        if (!sudahIkutSesiLain) {
          throw ApiError.badRequest('Kuota peserta untuk kegiatan ini telah penuh.');
        }
      }
    }

    const now = new Date();
    const jamMulai = sesi.jam_mulai; // 'HH:mm:ss'
    const [h, m] = jamMulai.split(':').map(Number);
    const batasHadir = new Date(sesi.tanggal);
    batasHadir.setHours(h, m + 15, 0); // toleransi 15 menit
    const status = now > batasHadir ? 'terlambat' : 'hadir';

    try {
      const absensi = await db.Absensi.create(
        {
          user_id: userId,
          kegiatan_id: sesi.kegiatan_id,
          sesi_id: sesiId,
          metode: 'qr_scan',
          waktu_checkin: now,
          status,
        },
        { transaction: t }
      );

      return { absensi, sesi, status };
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError' || err.code === 'ER_DUP_ENTRY') {
        throw ApiError.conflict('Anda sudah tercatat hadir pada sesi ini.');
      }
      throw err;
    }
  });

  return result;
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

  // 1. Validasi sesi harus dalam keadaan terbuka
  if (!sesi.is_open) {
    throw ApiError.badRequest('Sesi absensi sedang ditutup. Buka sesi terlebih dahulu untuk mencatat kehadiran.');
  }

  // Validasi apakah waktu sesi sudah lewat / selesai
  const nowCheckManual = new Date();
  const [endH = 23, endM = 59] = (sesi.jam_selesai || '23:59:00').split(':').map(Number);
  const endDateTime = new Date(sesi.tanggal);
  endDateTime.setHours(endH, endM, 0, 0);

  if (nowCheckManual > endDateTime) {
    await sesi.update({ is_open: false });
    throw ApiError.badRequest('Sesi absensi telah berakhir/selesai. Tidak dapat melakukan presensi.');
  }

  // 2. Validasi kegiatan harus berstatus aktif
  if (!sesi.kegiatan || sesi.kegiatan.status !== 'aktif') {
    throw ApiError.badRequest('Kegiatan ini tidak aktif.');
  }

  // 3. Cek user ada dan aktif
  const user = await db.User.findByPk(userId);
  if (!user || !user.is_active) {
    throw ApiError.notFound('User tidak ditemukan atau akun dinonaktifkan.');
  }

  // 4. Cek duplikasi absensi di sesi ini
  const existing = await db.Absensi.findOne({
    where: { user_id: userId, sesi_id: sesiId },
  });

  if (existing) {
    throw ApiError.conflict('User sudah tercatat hadir pada sesi ini.');
  }

  // 5. Validasi kuota peserta (jika kuota diatur)
  if (sesi.kegiatan.kuota && sesi.kegiatan.kuota > 0) {
    const totalPeserta = await db.Absensi.count({
      where: { kegiatan_id: sesi.kegiatan_id },
      distinct: true,
      col: 'user_id',
    });

    if (totalPeserta >= sesi.kegiatan.kuota) {
      const sudahIkutSesiLain = await db.Absensi.findOne({
        where: { user_id: userId, kegiatan_id: sesi.kegiatan_id },
      });
      if (!sudahIkutSesiLain) {
        throw ApiError.badRequest('Kuota peserta untuk kegiatan ini telah penuh.');
      }
    }
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
      { model: db.User, as: 'user', attributes: ['id', 'nama', 'nim', 'prodi', 'angkatan', 'email', 'no_hp'] },
      { model: db.User, as: 'verifikator', attributes: ['id', 'nama', 'role'] },
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
