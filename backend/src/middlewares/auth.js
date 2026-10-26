const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const db = require('../models');

/**
 * Middleware: Verifikasi JWT token dari header Authorization.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token tidak ditemukan. Silakan login.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      throw ApiError.unauthorized('User tidak ditemukan atau nonaktif.');
    }

    req.user = user.toSafeJSON();
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token tidak valid atau sudah kadaluarsa.'));
    }
    next(err);
  }
};

module.exports = authenticate;
