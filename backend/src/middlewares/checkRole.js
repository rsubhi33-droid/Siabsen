const ApiError = require('../utils/ApiError');

/**
 * Middleware: Cek role pengguna. Menerima daftar role yang diizinkan.
 * @param  {...string} allowedRoles - 'admin', 'panitia', 'dosen', 'mahasiswa'
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Role '${req.user.role}' tidak memiliki akses ke resource ini.`));
    }
    next();
  };
};

module.exports = checkRole;
