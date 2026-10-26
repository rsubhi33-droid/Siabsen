const absensiService = require('../services/absensi.service');
const { success, created, paginated } = require('../utils/response');

/**
 * POST /api/absensi/scan
 */
const scanQr = async (req, res, next) => {
  try {
    const result = await absensiService.checkInViaQr(req.user.id, req.body.qr_token);

    return created(res, {
      message: `Check-in berhasil! Status: ${result.status}.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/absensi/manual
 */
const manualCheckIn = async (req, res, next) => {
  try {
    const { user_id, sesi_id, catatan } = req.body;
    const result = await absensiService.checkInManual(user_id, sesi_id, req.user.id, catatan);

    return created(res, {
      message: 'Absensi manual berhasil dicatat.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/absensi/sesi/:sesiId
 */
const getBySesi = async (req, res, next) => {
  try {
    const data = await absensiService.getAttendanceBySesi(req.params.sesiId);
    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/absensi/riwayat
 */
const getRiwayat = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await absensiService.getUserAttendanceHistory(req.user.id, { page, limit });

    return paginated(res, {
      data: result.data,
      page: result.page,
      limit: result.limit,
      totalItems: result.totalItems,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { scanQr, manualCheckIn, getBySesi, getRiwayat };
